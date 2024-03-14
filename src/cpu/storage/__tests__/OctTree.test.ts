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
let octTree: OctTree<string>;

beforeEach(() => {
  boundary = new THREE.Box3(
    new THREE.Vector3(-10, -10, -10),
    new THREE.Vector3(10, 10, 10),
  );

  capacity = 4;

  octTree = new OctTree(boundary, capacity);
});

it("inserts nodes within boundary", () => {
  const node = new Node(new THREE.Vector3(0, 0, 0), "test");
  expect(octTree.insert(node)).toBe(true);
  expect(octTree.size).toBe(1);
});

it("does not insert nodes outside boundary", () => {
  const node = new Node(new THREE.Vector3(20, 20, 20), "test");
  expect(octTree.insert(node)).toBe(false);
  expect(octTree.size).toBe(0);
});

it("subdivides when capacity exceeded", () => {
  for (let i = 0; i < capacity; i++) {
    octTree.insert(new Node(randomPointWithin(boundary), "test"));
  }
  // Insert one more to exceed capacity and trigger subdivision
  octTree.insert(new Node(randomPointWithin(boundary), "test_extra"));
  expect(octTree.depth).toEqual(2);
});

it("queries range correctly", () => {
  octTree.insert(new Node(new THREE.Vector3(1, 1, 1), `test_0`));
  octTree.insert(new Node(new THREE.Vector3(0.5, 0.5, 0.5), `test_1`));
  octTree.insert(new Node(new THREE.Vector3(-0.5, -0.5, -0.5), `test_2`));
  octTree.insert(new Node(new THREE.Vector3(-1, -1, -1), `test_3`));
  octTree.insert(new Node(boundary.min.clone(), `test_4`));
  octTree.insert(new Node(boundary.min.clone(), `test_5`));
  octTree.insert(new Node(boundary.max.clone(), `test_6`));
  octTree.insert(new Node(boundary.max.clone(), `test_7`));

  // These nodes should be within the query range
  const insideNodes = [
    new Node(new THREE.Vector3(6, 6, 6), "inside1"),
    new Node(new THREE.Vector3(8, 8, 8), "inside2"),
  ];
  insideNodes.forEach((node) => octTree.insert(node));

  // These nodes should be outside the query range
  const outsideNodes = [
    new Node(new THREE.Vector3(-8, -8, -8), "outside1"),
    new Node(new THREE.Vector3(-4, -4, -4), "outside2"),
  ];
  outsideNodes.forEach((node) => octTree.insert(node));

  const queryRange = new THREE.Sphere(new THREE.Vector3(5, 5, 5), 3);

  // Perform the range query
  const found = octTree.queryRange(queryRange);
  console.log(found);

  // Check that only the nodes within the query range are returned
  insideNodes.forEach((node) => expect(found).toContain(node));
  outsideNodes.forEach((node) => expect(found).not.toContain(node));
});

it("clears all nodes correctly", () => {
  for (let i = 0; i < capacity * 2; i++) {
    octTree.insert(new Node(randomPointWithin(boundary), `test_${i}`));
  }
  expect(octTree.size).toEqual(capacity * 2);

  octTree.clear();

  expect(octTree.size).toBe(0);
});

it("calculates total size correctly", () => {
  for (let i = 0; i < capacity * 2; i++) {
    // insert double the capacity to ensure subdivision
    octTree.insert(new Node(randomPointWithin(boundary), `test_${i}`));
  }
  expect(octTree.size).toBe(capacity * 2);
});

it("retrieves boundaries correctly", () => {
  octTree.insert(new Node(new THREE.Vector3(0, 0, 0), "test"));
  const boundaries = octTree.boundaries;
  expect(boundaries).toContainEqual(boundary);
});

it("doesn't return a boundary if there are no inserted nodes", () => {
  const boundaries = octTree.boundaries;
  expect(boundaries).toHaveLength(0);
});
