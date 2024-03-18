import * as THREE from "three";
import { it, expect, beforeEach } from "vitest";
import OctTree, { Node } from "../OctTree";

function randomPointWithin(box: THREE.Box3) {
  const min = box.min,
    max = box.max;
  return new THREE.Vector3(
    Math.random() * (max.x - min.x) + min.x,
    Math.random() * (max.y - min.y) + min.y,
    Math.random() * (max.z - min.z) + min.z,
  );
}

let boundary: THREE.Box3;
let capacity: number;
let octTree: OctTree<Node>;
const seed = 1234567;

beforeEach(() => {
  boundary = new THREE.Box3(
    new THREE.Vector3(-10, -10, -10),
    new THREE.Vector3(10, 10, 10),
  );

  capacity = 4;

  octTree = new OctTree(boundary, capacity, seed);
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

it("subdivides when capacity exceeded", () => {
  for (let i = 0; i < capacity; i++) {
    octTree.insert({ position: randomPointWithin(boundary) });
  }
  // Insert one more to exceed capacity and trigger subdivision
  octTree.insert({ position: randomPointWithin(boundary) });
  expect(octTree.depth).toEqual(2);
});

it("queries range correctly", () => {
  octTree.insert({ position: new THREE.Vector3(1, 1, 1) });
  octTree.insert({ position: new THREE.Vector3(0.5, 0.5, 0.5) });
  octTree.insert({ position: new THREE.Vector3(-0.5, -0.5, -0.5) });
  octTree.insert({ position: new THREE.Vector3(-1, -1, -1) });
  octTree.insert({ position: boundary.min.clone() });
  octTree.insert({ position: boundary.min.clone() });
  octTree.insert({ position: boundary.max.clone() });
  octTree.insert({ position: boundary.max.clone() });

  // These nodes should be within the query range
  const insideNodes = [
    { position: new THREE.Vector3(6, 6, 6) },
    { position: new THREE.Vector3(8, 8, 8) },
  ];
  insideNodes.forEach((node) => octTree.insert(node));

  // These nodes should be outside the query range
  const outsideNodes = [
    { position: new THREE.Vector3(-8, -8, -8) },
    { position: new THREE.Vector3(-4, -4, -4) },
  ];
  outsideNodes.forEach((node) => octTree.insert(node));

  const queryRange = new THREE.Sphere(new THREE.Vector3(5, 5, 5), 3);

  // Perform the range query
  const found = octTree.queryRange(queryRange);

  // Check that only the nodes within the query range are returned
  insideNodes.forEach((node) => expect(found).toContain(node));
  outsideNodes.forEach((node) => expect(found).not.toContain(node));
});

it("clears all nodes correctly", () => {
  for (let i = 0; i < capacity * 2; i++) {
    octTree.insert({ position: randomPointWithin(boundary) });
  }
  expect(octTree.size).toEqual(capacity * 2);

  octTree.clear();

  expect(octTree.size).toBe(0);
});

it("calculates total size correctly", () => {
  for (let i = 0; i < capacity * 2; i++) {
    // insert double the capacity to ensure subdivision
    octTree.insert({ position: randomPointWithin(boundary) });
  }
  expect(octTree.size).toBe(capacity * 2);
});

it("retrieves boundaries correctly", () => {
  octTree.insert({ position: new THREE.Vector3(0, 0, 0) });
  const boundaries = octTree.boundaries;
  expect(boundaries).toContainEqual(boundary);
});

it("doesn't return a boundary if there are no inserted nodes", () => {
  const boundaries = octTree.boundaries;
  expect(boundaries).toHaveLength(0);
});

it("calcualtes trees correctly", () => {
  const position = new THREE.Vector3();
  for (let i = 0; i < capacity; i++) {
    octTree.insert({ position });
  }
  expect(octTree.trees).toBe(1);

  // subdivision
  octTree.insert({ position });
  expect(octTree.trees).toBe(9);

  // subdivision on last insert
  for (let i = 0; i < capacity; i++) {
    octTree.insert({ position });
  }
  expect(octTree.trees).toBe(17);

  // subdivision on last insert
  for (let i = 0; i < capacity; i++) {
    octTree.insert({ position });
  }
  expect(octTree.trees).toBe(25);
});
