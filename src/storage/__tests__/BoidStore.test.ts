import * as THREE from "three";
import { it, beforeEach, expect } from "vitest";
import Boid from "../../behavior/Boid";
import Obstacle from "../../obstacle/Obstacle";
import OctTree from "../OctTree";
import BoidStore from "../BoidStore";

const CAPACITY = 4;
const MAX_DEPTH = 8;

let store: BoidStore;
let octTree: OctTree<Boid>;
let boundary: THREE.Box3;

function makeBoid(id: number, position = new THREE.Vector3()): Boid {
  return new Boid({
    id,
    parentId: 3,
    position,
    velocity: new THREE.Vector3(),
  });
}

beforeEach(() => {
  boundary = new THREE.Box3(
    new THREE.Vector3(-10, -10, -10),
    new THREE.Vector3(10, 10, 10),
  );
  octTree = new OctTree(boundary, CAPACITY, MAX_DEPTH);

  store = new BoidStore(octTree);
});

it("should insert boids", () => {
  const boids = [makeBoid(1), makeBoid(2), makeBoid(3)];

  boids.forEach((boid) => store.insert(boid));

  expect(store.boids).toEqual(boids);
});

it("should throw an error when trying to re-insert boids", () => {
  const boid = makeBoid(1);

  store.insert(boid);

  expect(() => store.insert(boid)).toThrow(/already inserted/);
});

it("should throw an error when trying to insert a boid that is out of range", () => {
  const boid = makeBoid(1, boundary.max.clone().multiplyScalar(2));

  expect(() => store.insert(boid)).toThrow(/unable to be inserted/);
});

it("should hold the obstacles it is given", () => {
  const obstacle = new Obstacle(new THREE.Vector3(1, 2, 3), 4);

  store.insertObstacle(obstacle);

  expect(store.obstacles).toEqual([obstacle]);
});

it("should return the boids within a queried range", () => {
  const near = makeBoid(1, new THREE.Vector3(1, 0, 0));
  const far = makeBoid(2, new THREE.Vector3(9, 0, 0));
  store.insert(near);
  store.insert(far);

  const result = store.queryRange(new THREE.Sphere(new THREE.Vector3(), 3));

  expect(result).toEqual([near]);
});

it("should keep the flock, and its identity, across a reindex", () => {
  const boids = Array.from({ length: 10 }, (_, i) =>
    makeBoid(i, new THREE.Vector3(i - 5, 0, 0)),
  );
  boids.forEach((boid) => store.insert(boid));

  const before = store.boids;
  boids.forEach((boid) => boid.position.set(0, boid.id - 5, 0));
  store.reindex();

  // same array, so a renderer memoising on it is not torn down every frame
  expect(store.boids).toBe(before);
  expect(store.boids).toEqual(boids);

  // and the tree now indexes them where they moved to, not where they were
  expect(
    store.queryRange(new THREE.Sphere(new THREE.Vector3(0, 4, 0), 0.5)),
  ).toEqual([boids[9]]);
  expect(
    store.queryRange(new THREE.Sphere(new THREE.Vector3(4, 0, 0), 0.5)),
  ).toHaveLength(0);
});

it("should index each boid once however many times it is reindexed", () => {
  const boids = Array.from({ length: 10 }, (_, i) =>
    makeBoid(i, new THREE.Vector3(i - 5, 0, 0)),
  );
  boids.forEach((boid) => store.insert(boid));

  store.reindex();
  store.reindex();

  // rebuilding without clearing first leaves a stale copy of every boid per
  // rebuild: the tree grows without bound and each boid is its own neighbour
  const everything = store.queryRange(
    new THREE.Sphere(new THREE.Vector3(), 100),
  );
  expect(everything).toHaveLength(boids.length);
  expect(new Set(everything).size).toBe(boids.length);
});

it("should throw out of a reindex when a boid has left the tree", () => {
  const boid = makeBoid(1);
  store.insert(boid);

  boid.position.copy(boundary.max).multiplyScalar(2);

  expect(() => store.reindex()).toThrow(/outside the storage boundary/);
});

it("should leave the index intact when a reindex throws", () => {
  const staying = makeBoid(1, new THREE.Vector3(1, 0, 0));
  const leaving = makeBoid(2, new THREE.Vector3(2, 0, 0));
  store.insert(staying);
  store.insert(leaving);

  leaving.position.copy(boundary.max).multiplyScalar(2);

  expect(() => store.reindex()).toThrow();

  // tearing the tree down before checking would leave the caller holding a
  // half-indexed flock to abandon the frame on
  expect(
    store.queryRange(new THREE.Sphere(new THREE.Vector3(1, 0, 0), 0.5)),
  ).toEqual([staying]);
});
