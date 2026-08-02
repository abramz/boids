import * as THREE from "three";
import { beforeEach, describe, expect, it } from "vitest";
import { seededRandom } from "../../__fixtures__/seededRandom";
import Candidates from "../Candidates";
import HashGrid from "../HashGrid";
import { Node } from "../Node";

interface TestNode extends Node {
  id: number;
}

const CELL_SIZE = 1;
const TABLE_SIZE = 1024;

/** Half the width of the lattice the suite queries, in cells. */
const REACH = 3;

const found = new Candidates<TestNode>();

function ids(): number[] {
  return [...found].map((node) => node.id).sort((a, b) => a - b);
}

/**
 * A cube of nodes one cell apart, spanning zero so that the cells either side
 * of it are both covered.
 */
function lattice(): TestNode[] {
  const nodes: TestNode[] = [];

  for (let x = -REACH; x <= REACH; x++) {
    for (let y = -REACH; y <= REACH; y++) {
      for (let z = -REACH; z <= REACH; z++) {
        nodes.push({ id: nodes.length, position: new THREE.Vector3(x, y, z) });
      }
    }
  }

  return nodes;
}

function bruteForce(nodes: TestNode[], range: THREE.Sphere): number[] {
  return nodes
    .filter((node) => range.containsPoint(node.position))
    .map((node) => node.id)
    .sort((a, b) => a - b);
}

let grid: HashGrid<TestNode>;
let nodes: TestNode[];

beforeEach(() => {
  grid = new HashGrid<TestNode>({
    cellSize: CELL_SIZE,
    tableSize: TABLE_SIZE,
  });
  nodes = lattice();
  grid.build(nodes);
});

it("rejects a cell size nothing could be sorted into", () => {
  expect(() => new HashGrid({ cellSize: 0, tableSize: 16 })).toThrow(
    /cellSize/,
  );
});

it("rejects a table with no buckets to hash into", () => {
  expect(() => new HashGrid({ cellSize: 1, tableSize: 0 })).toThrow(
    /tableSize/,
  );
});

it("separates cells that share a bucket rather than confusing them", () => {
  /* one bucket, so every cell in the lattice collides with every other. The
     index checks which cell a node is really in, so the answer is unchanged
     and no node is handed back twice for having collided with itself. */
  const colliding = new HashGrid<TestNode>({
    cellSize: CELL_SIZE,
    tableSize: 1,
  });
  colliding.build(nodes);
  const range = new THREE.Sphere(new THREE.Vector3(0.5, 0, 0), 0.9);

  colliding.queryRange(range, found);

  expect(ids()).toEqual(bruteForce(nodes, range));
});

/* a cell narrower than the lattice spacing and one wider, since at a cell size
   of one scaling a coordinate up and dividing it back down are the same sum */
it.each([0.4, 2.5])(
  "agrees with a brute force scan over random ranges, at a cell size of %s",
  (cellSize) => {
    /* the whole index in one assertion: a wrong shell, a truncated cell
     coordinate and a mishandled collision all show up as a disagreement */
    const sized = new HashGrid<TestNode>({ cellSize, tableSize: TABLE_SIZE });
    sized.build(nodes);
    const random = seededRandom();
    const center = new THREE.Vector3();
    const range = new THREE.Sphere();

    for (let attempt = 0; attempt < 200; attempt++) {
      const reach = REACH + 1;
      center.set(
        (random() - 0.5) * 2 * reach,
        (random() - 0.5) * 2 * reach,
        (random() - 0.5) * 2 * reach,
      );
      /* radii either side of the cell size, so both a shell of one cell and a
       shell of several are exercised */
      range.set(center, random() * 3 * cellSize);

      sized.queryRange(range, found);

      expect(ids(), `range ${center.toArray()} r${range.radius}`).toEqual(
        bruteForce(nodes, range),
      );
    }
  },
);

it("holds a node however far out it has gone", () => {
  /* past the int32 boundary the cell coordinate is taken to, so a cell is only
     looked up where it was stored if both ends wrap the same way */
  const strayed = { id: 999, position: new THREE.Vector3(1e10, -1e10, 1e10) };
  grid.build([...nodes, strayed]);

  grid.queryRange(new THREE.Sphere(strayed.position.clone(), 0.5), found);

  expect(ids()).toEqual([999]);
  // the caller's own node, not a copy of it: the boids it holds are steered
  // through the reference the query hands back
  expect([...found][0]).toBe(strayed);
});

it("scans the nodes when a range reaches over more cells than there are", () => {
  /* a perception radius can be dragged up to the width of the world, where
     walking the cells it covers costs far more than testing every node */
  const range = new THREE.Sphere(new THREE.Vector3(), 1e4);

  grid.queryRange(range, found);

  expect(ids()).toEqual(bruteForce(nodes, range));
  expect(ids()).toHaveLength(nodes.length);
});

it("replaces what it held rather than accumulating it", () => {
  grid.build(nodes);
  grid.build(nodes);

  /* narrow enough to stay on the cell path: the scan the wider ranges fall
     back to reads neither of the arrays a rebuild could double up */
  const range = new THREE.Sphere(new THREE.Vector3(0.5, 0, 0), 0.9);
  grid.queryRange(range, found);

  expect(ids()).toEqual(bruteForce(nodes, range));
});

describe("occupiedCells", () => {
  it("gives one box per cell holding nodes, whatever it holds", () => {
    const twoInOne = [
      { id: 0, position: new THREE.Vector3(0.25, 0.25, 0.25) },
      { id: 1, position: new THREE.Vector3(0.75, 0.75, 0.75) },
      { id: 2, position: new THREE.Vector3(9.5, 0.25, 0.25) },
    ];
    grid.build(twoInOne);

    const cells = grid.occupiedCells();

    expect(cells).toHaveLength(2);
    expect(cells).toContainEqual(
      new THREE.Box3(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(CELL_SIZE, CELL_SIZE, CELL_SIZE),
      ),
    );
  });

  it("sizes a box by the cell size rather than the lattice it happens to hold", () => {
    /* every other case here runs at a cell size of one, where scaling a cell
       coordinate up to world units and dividing back down are the same sum */
    const wide = new HashGrid<TestNode>({ cellSize: 4, tableSize: TABLE_SIZE });
    wide.build([{ id: 0, position: new THREE.Vector3(5, 1, 1) }]);

    expect(wide.occupiedCells()).toEqual([
      new THREE.Box3(new THREE.Vector3(4, 0, 0), new THREE.Vector3(8, 4, 4)),
    ]);
  });

  it("puts a cell either side of zero rather than one straddling it", () => {
    /* the cell coordinate is floored rather than truncated; truncation folds
       -0.5 and 0.5 into the same cell and doubles its width across the origin */
    grid.build([
      { id: 0, position: new THREE.Vector3(-0.5, -0.5, -0.5) },
      { id: 1, position: new THREE.Vector3(0.5, 0.5, 0.5) },
    ]);

    expect(grid.occupiedCells()).toHaveLength(2);
  });
});
