import * as THREE from "three";
import { it, beforeEach, expect } from "vitest";
import Boid from "../../behavior/Boid";
import OctTree from "../OctTree";
import BoidStore from "../BoidStore";

let store: BoidStore;
let octTree: OctTree<Boid>;
let boundary: THREE.Box3;
let capacity: number;

beforeEach(() => {
  capacity = 4;
  boundary = new THREE.Box3(
    new THREE.Vector3(-10, -10, -10),
    new THREE.Vector3(10, 10, 10),
  );
  octTree = new OctTree(boundary, capacity);

  store = new BoidStore(octTree);
});

it("should insert boids", () => {
  const boid1 = new Boid({
    id: 1,
    parentId: 3,
    position: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
  });

  const boid2 = new Boid({
    id: 2,
    parentId: 3,
    position: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
  });

  const boid3 = new Boid({
    id: 3,
    parentId: 3,
    position: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
  });

  store.insert(boid1);
  store.insert(boid2);
  store.insert(boid3);

  expect(store.boids).toContain(boid1);
  expect(store.boids).toContain(boid2);
  expect(store.boids).toContain(boid3);
});

it("should throw an error when trying to re-insert boids", () => {
  const boid = new Boid({
    id: 1,
    parentId: 3,
    position: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
  });

  store.insert(boid);

  expect(() => {
    store.insert(boid);
  }).toThrow();
});

it("should throw an error when trying to insert a boid that is out of range", () => {
  const boid = new Boid({
    id: 1,
    parentId: 3,
    position: boundary.max.clone().multiplyScalar(2),
    velocity: new THREE.Vector3(),
  });

  expect(() => {
    store.insert(boid);
  }).toThrow();
});

it("should query the OctTree range when", () => {
  const boid = new Boid({
    id: 1,
    parentId: 3,
    position: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
  });

  store.insert(boid);

  const result = store.queryRange(new THREE.Sphere(new THREE.Vector3(), 3));

  expect(result).toContain(boid);
});

it("should clear itself and the OctTree", () => {
  for (let i = 0; i < 10; i++) {
    store.insert(
      new Boid({
        id: i,
        parentId: 3,
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
      }),
    );
  }

  expect(store.boids).toHaveLength(10);

  store.clear();

  expect(store.boids).toHaveLength(0);
});
