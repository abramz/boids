import * as THREE from "three";
import { it, beforeEach, expect } from "vitest";
import Boid from "../../behavior/Boid";
import Obstacle from "../../obstacle/Obstacle";
import Candidates from "../Candidates";
import HashGrid from "../HashGrid";
import BoidStore from "../BoidStore";

const CELL_SIZE = 2;
const TABLE_SIZE = 64;

let store: BoidStore;

/* the store fills a buffer rather than returning one; this reads it back out */
const found = new Candidates<Boid>();

function query(range: THREE.Sphere): Boid[] {
  store.queryRange(range, found);

  return [...found];
}

function makeBoid(id: number, position = new THREE.Vector3()): Boid {
  return new Boid({
    id,
    parentId: 3,
    position,
    velocity: new THREE.Vector3(),
  });
}

beforeEach(() => {
  store = new BoidStore(
    new HashGrid<Boid>({ cellSize: CELL_SIZE, tableSize: TABLE_SIZE }),
  );
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

it("should hold the obstacles it is given", () => {
  const obstacle = new Obstacle(new THREE.Vector3(1, 2, 3), 4);

  store.insertObstacle(obstacle);

  expect(store.obstacles).toEqual([obstacle]);
});

it("should show an inserted boid to a query only once reindexed", () => {
  /* the index is built in one pass over the flock rather than a boid at a
     time, so insert alone leaves it holding the flock it was last built on */
  store.insert(makeBoid(1, new THREE.Vector3(1, 0, 0)));

  expect(query(new THREE.Sphere(new THREE.Vector3(), 3))).toHaveLength(0);

  store.reindex();

  expect(query(new THREE.Sphere(new THREE.Vector3(), 3))).toHaveLength(1);
});

it("should return the boids within a queried range", () => {
  const near = makeBoid(1, new THREE.Vector3(1, 0, 0));
  const far = makeBoid(2, new THREE.Vector3(9, 0, 0));
  store.insert(near);
  store.insert(far);
  store.reindex();

  const result = query(new THREE.Sphere(new THREE.Vector3(), 3));

  expect(result).toEqual([near]);
});

it("should take a boid however far outside the world it has gone", () => {
  /* nothing clamps a position and the index has no outer wall, so however far
     edge avoidance let a boid get is somewhere the index still reaches */
  const strayed = makeBoid(1, new THREE.Vector3(1e6, -1e6, 1e6));
  store.insert(strayed);
  store.reindex();

  expect(query(new THREE.Sphere(strayed.position.clone(), 1))).toEqual([
    strayed,
  ]);
});

it("should keep the flock, and its identity, across a reindex", () => {
  const boids = Array.from({ length: 10 }, (_, i) =>
    makeBoid(i, new THREE.Vector3(i - 5, 0, 0)),
  );
  boids.forEach((boid) => store.insert(boid));
  store.reindex();

  const before = store.boids;
  boids.forEach((boid) => boid.position.set(0, boid.id - 5, 0));
  store.reindex();

  // same array, so a renderer memoising on it is not torn down every frame
  expect(store.boids).toBe(before);
  expect(store.boids).toEqual(boids);

  // and the index now holds them where they moved to, not where they were
  expect(query(new THREE.Sphere(new THREE.Vector3(0, 4, 0), 0.5))).toEqual([
    boids[9],
  ]);
  expect(query(new THREE.Sphere(new THREE.Vector3(4, 0, 0), 0.5))).toHaveLength(
    0,
  );
});

it("should index each boid once however many times it is reindexed", () => {
  const boids = Array.from({ length: 10 }, (_, i) =>
    makeBoid(i, new THREE.Vector3(i - 5, 0, 0)),
  );
  boids.forEach((boid) => store.insert(boid));

  store.reindex();
  store.reindex();

  // rebuilding without clearing first leaves a stale copy of every boid per
  // rebuild: each boid becomes several of its own neighbours
  const everything = query(new THREE.Sphere(new THREE.Vector3(), 100));
  expect(everything).toHaveLength(boids.length);
  expect(new Set(everything).size).toBe(boids.length);
});

it("should report the cells the flock occupies", () => {
  store.insert(makeBoid(1, new THREE.Vector3(0.5, 0.5, 0.5)));
  // same cell as the first, so the two of them are one box
  store.insert(makeBoid(2, new THREE.Vector3(1.5, 1.5, 1.5)));
  store.insert(makeBoid(3, new THREE.Vector3(20, 0.5, 0.5)));
  store.reindex();

  expect(store.boundaries).toHaveLength(2);
});
