import * as THREE from "three";
import { beforeEach, describe, expect, it } from "vitest";
import { seededRandom } from "../../__fixtures__/seededRandom";
import QueryResults from "../QueryResults";
import HashGrid from "../HashGrid";
import { Node } from "../Node";

interface TestNode extends Node {
  id: number;
}

const CELL_SIZE = 1;
const TABLE_SIZE = 1024;

const REACH = 3;

const found = new QueryResults<TestNode>();

function ids(): number[] {
  return [...found].map((node) => node.id).sort((a, b) => a - b);
}

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
  const colliding = new HashGrid<TestNode>({
    cellSize: CELL_SIZE,
    tableSize: 1,
  });
  colliding.build(nodes);
  const range = new THREE.Sphere(new THREE.Vector3(0.5, 0, 0), 0.9);

  colliding.queryRange(range, found);

  expect(ids()).toEqual(bruteForce(nodes, range));
});

it.each([0.4, 2.5])(
  "agrees with a brute force scan over random ranges, at a cell size of %s",
  (cellSize) => {
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
      range.set(center, random() * 3 * cellSize);

      sized.queryRange(range, found);

      expect(ids(), `range ${center.toArray()} r${range.radius}`).toEqual(
        bruteForce(nodes, range),
      );
    }
  },
);

it("holds a node however far out it has gone", () => {
  const strayed = { id: 999, position: new THREE.Vector3(1e10, -1e10, 1e10) };
  grid.build([...nodes, strayed]);

  grid.queryRange(new THREE.Sphere(strayed.position.clone(), 0.5), found);

  expect(ids()).toEqual([999]);
  expect([...found][0]).toBe(strayed);
});

it("scans the nodes when a range reaches over more cells than there are", () => {
  const range = new THREE.Sphere(new THREE.Vector3(), 1e4);

  grid.queryRange(range, found);

  expect(ids()).toEqual(bruteForce(nodes, range));
  expect(ids()).toHaveLength(nodes.length);
});

it("replaces what it held rather than accumulating it", () => {
  grid.build(nodes);
  grid.build(nodes);

  const range = new THREE.Sphere(new THREE.Vector3(0.5, 0, 0), 0.9);
  grid.queryRange(range, found);

  expect(ids()).toEqual(bruteForce(nodes, range));
});

it("finds a neighbor across the coordinate an int32 cell index would wrap at", () => {
  const wrapped = { id: 999, position: new THREE.Vector3(2 ** 31 - 0.1, 0, 0) };
  grid.build([...nodes, wrapped]);

  grid.queryRange(
    new THREE.Sphere(new THREE.Vector3(2 ** 31 + 0.5, 0, 0), 1),
    found,
  );

  expect(ids()).toEqual([999]);
});

it("does not see a node the array grew since the last build", () => {
  nodes.push({ id: nodes.length, position: new THREE.Vector3(0.5, 0, 0) });

  const range = new THREE.Sphere(new THREE.Vector3(0.5, 0, 0), 0.4);
  grid.queryRange(range, found);
  expect(ids()).toEqual([]);

  grid.build(nodes);
  grid.queryRange(range, found);

  expect(ids()).toEqual([nodes.length - 1]);
});

describe("occupiedCells", () => {
  it("counts what the last build indexed, not what the array holds now", () => {
    const grown = [{ id: 0, position: new THREE.Vector3(0.5, 0, 0) }];
    grid.build(grown);
    grown.push({ id: 1, position: new THREE.Vector3(50, 0, 0) });

    const cells = grid.occupiedCells();

    expect(cells).toHaveLength(1);
    expect(cells[0].min.toArray()).toEqual([0, 0, 0]);
  });

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
    const wide = new HashGrid<TestNode>({ cellSize: 4, tableSize: TABLE_SIZE });
    wide.build([{ id: 0, position: new THREE.Vector3(5, 1, 1) }]);

    expect(wide.occupiedCells()).toEqual([
      new THREE.Box3(new THREE.Vector3(4, 0, 0), new THREE.Vector3(8, 4, 4)),
    ]);
  });

  it("puts a cell either side of zero rather than one straddling it", () => {
    grid.build([
      { id: 0, position: new THREE.Vector3(-0.5, -0.5, -0.5) },
      { id: 1, position: new THREE.Vector3(0.5, 0.5, 0.5) },
    ]);

    expect(grid.occupiedCells()).toHaveLength(2);
  });
});
