import * as THREE from "three";
import { it, expect, beforeEach } from "vitest";
import { seededRandom } from "../../__fixtures__/seededConfig";
import Candidates from "../Candidates";
import OctTree, { Node } from "../OctTree";

const CAPACITY = 4;
const MAX_DEPTH = 8;

/* the tree fills a buffer rather than returning one; these read it back out */
const found = new Candidates<Node>();

function query(tree: OctTree<Node>, range: THREE.Sphere): Node[] {
  tree.queryRange(range, found);

  return [...found];
}

/* seeded, so a failure in any of the tests that fill a tree is reproducible */
const random = seededRandom();

function randomPointWithin(box: THREE.Box3): THREE.Vector3 {
  const { min, max } = box;

  return new THREE.Vector3(
    random() * (max.x - min.x) + min.x,
    random() * (max.y - min.y) + min.y,
    random() * (max.z - min.z) + min.z,
  );
}

let boundary: THREE.Box3;
let octTree: OctTree<Node>;

beforeEach(() => {
  boundary = new THREE.Box3(
    new THREE.Vector3(-10, -10, -10),
    new THREE.Vector3(10, 10, 10),
  );

  octTree = new OctTree(boundary, CAPACITY, MAX_DEPTH);
});

it("rejects a capacity it could never fit a node into", () => {
  expect(() => new OctTree(boundary, 0, MAX_DEPTH)).toThrow(/capacity/);
});

it("inserts nodes within boundary", () => {
  const node = { position: new THREE.Vector3(0, 0, 0) };
  expect(octTree.insert(node)).toBe(true);
  expect(octTree.size).toBe(1);
});

it("does not insert nodes outside boundary", () => {
  const node = { position: new THREE.Vector3(20, 20, 20) };
  expect(octTree.insert(node)).toBe(false);
  expect(octTree.size).toBe(0);
});

it("does not insert a node whose position is not a number", () => {
  const node = { position: new THREE.Vector3(NaN, 0, 0) };
  expect(octTree.insert(node)).toBe(false);
  expect(octTree.size).toBe(0);
});

it("subdivides when capacity exceeded", () => {
  for (let i = 0; i < CAPACITY + 1; i++) {
    octTree.insert({ position: randomPointWithin(boundary) });
  }

  expect(octTree.height).toEqual(2);
});

it("stops subdividing at the maximum depth", () => {
  // no split ever separates points that coincide, and the boundary clamp in
  // step.ts drives boids into a corner at exactly the same position
  const shallow = new OctTree<Node>(boundary, CAPACITY, 3);
  const position = new THREE.Vector3(1, 1, 1);
  const count = CAPACITY * 20;

  for (let i = 0; i < count; i++) {
    shallow.insert({ position: position.clone() });
  }

  expect(shallow.height).toBe(4); // the root, plus its three levels
  expect(shallow.size).toBe(count);
});

it("returns every node within the range and nothing outside it", () => {
  // fill the root so the tree is subdivided and the query has to descend
  [
    new THREE.Vector3(-8, -8, -8),
    new THREE.Vector3(-7, -7, -7),
    new THREE.Vector3(-6, -6, -6),
    new THREE.Vector3(-5, -5, -5),
    new THREE.Vector3(9, 9, 9),
  ].forEach((position) => octTree.insert({ position }));

  /* the sphere's centre sits in the -x octant while the node sits just over
     the face in the +x one: a cell test that asks whether it holds the centre
     rather than whether it meets the sphere never descends far enough to find
     it */
  const acrossTheFace = { position: new THREE.Vector3(0.25, 5, 5) };
  const sameCellButTooFar = { position: new THREE.Vector3(2, 5, 5) };
  octTree.insert(acrossTheFace);
  octTree.insert(sameCellButTooFar);

  const range = new THREE.Sphere(new THREE.Vector3(-0.5, 5, 5), 1);
  const inRange = query(octTree, range);

  expect(inRange).toContain(acrossTheFace);
  expect(inRange).not.toContain(sameCellButTooFar);
  inRange.forEach((node) =>
    expect(range.containsPoint(node.position)).toBe(true),
  );
});

it("returns nothing for a range that holds no nodes", () => {
  for (let i = 0; i < CAPACITY * 4; i++) {
    octTree.insert({ position: randomPointWithin(boundary) });
  }

  const empty = query(
    octTree,
    new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1e-9),
  );

  expect(empty).toHaveLength(0);
});

it("takes a node sitting exactly on the boundary of a subdivided tree", () => {
  // a world size that does not halve cleanly, so each subdivision has to reuse
  // the parent's own faces rather than recomputing them and landing inside
  const awkward = 31.358261834642246;
  const tree = new OctTree<Node>(
    new THREE.Box3(
      new THREE.Vector3(-awkward, -awkward, -awkward),
      new THREE.Vector3(awkward, awkward, awkward),
    ),
    CAPACITY,
    MAX_DEPTH,
  );

  // deep enough that the corner node has descended several subdivisions
  for (let i = 0; i < 500; i++) {
    tree.insert({ position: randomPointWithin(tree.boundary) });
  }

  const corners = [
    new THREE.Vector3(awkward, 0, 0),
    new THREE.Vector3(-awkward, 0, 0),
    new THREE.Vector3(awkward, awkward, awkward),
    new THREE.Vector3(-awkward, -awkward, -awkward),
  ];

  corners.forEach((position) => {
    expect(
      () => tree.insert({ position }),
      `${position.toArray()}`,
    ).not.toThrow();
  });
  expect(tree.size).toBe(500 + corners.length);
});

it("keeps the nodes a tree took before it subdivided in its boundaries", () => {
  const position = new THREE.Vector3();
  for (let i = 0; i < CAPACITY + 1; i++) {
    octTree.insert({ position: position.clone() });
  }

  // the first `capacity` still live in the root, so dropping the root's own box
  // would leave them drawn nowhere
  expect(octTree.boundaries).toContainEqual(boundary);
  expect(octTree.boundaries.length).toBeGreaterThan(1);
});

it("clears all nodes correctly", () => {
  for (let i = 0; i < CAPACITY * 2; i++) {
    octTree.insert({ position: randomPointWithin(boundary) });
  }
  expect(octTree.size).toEqual(CAPACITY * 2);

  octTree.clear();

  expect(octTree.size).toBe(0);
  expect(octTree.height).toBe(1);
});

it("counts every node it holds, however deep they sit", () => {
  for (let i = 0; i < CAPACITY * 8; i++) {
    octTree.insert({ position: randomPointWithin(boundary) });
  }

  expect(octTree.height).toBeGreaterThan(1);
  expect(octTree.size).toBe(CAPACITY * 8);
});

it("retrieves boundaries correctly", () => {
  octTree.insert({ position: new THREE.Vector3(0, 0, 0) });

  expect(octTree.boundaries).toContainEqual(boundary);
});

it("doesn't return a boundary if there are no inserted nodes", () => {
  expect(octTree.boundaries).toHaveLength(0);
});

it("grows one cell into eight when it subdivides", () => {
  const position = new THREE.Vector3();
  for (let i = 0; i < CAPACITY; i++) {
    octTree.insert({ position });
  }
  expect(octTree.subtreeCount).toBe(1);

  octTree.insert({ position });

  expect(octTree.subtreeCount).toBe(1 + 8);
});
