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
  /* reindexed before the second insert, since a store built only once is the
     one case where the index holds nothing to be stale */
  store.insert(makeBoid(1, new THREE.Vector3(1, 0, 0)));
  store.reindex();
  store.insert(makeBoid(2, new THREE.Vector3(-1, 0, 0)));

  expect(query(new THREE.Sphere(new THREE.Vector3(), 3))).toHaveLength(1);

  store.reindex();

  expect(query(new THREE.Sphere(new THREE.Vector3(), 3))).toHaveLength(2);
});

it("should not draw a cell for a boid it has not indexed yet", () => {
  /* counting the flock rather than the index would run off the end of what the
     index recorded and hand the visualiser a cell of NaN to draw */
  store.insert(makeBoid(1, new THREE.Vector3(1, 0, 0)));
  store.reindex();
  store.insert(makeBoid(2, new THREE.Vector3(50, 0, 0)));

  const cells = store.cellBoundaries();

  expect(cells).toHaveLength(1);
  expect(cells[0].min.toArray()).toEqual([0, 0, 0]);
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

  expect(query(new THREE.Sphere(new THREE.Vector3(0, 4, 0), 0.5))).toEqual([
    boids[9],
  ]);
  expect(query(new THREE.Sphere(new THREE.Vector3(4, 0, 0), 0.5))).toHaveLength(
    0,
  );
});

it("should index each boid once however many times it is reindexed", () => {
  /* enough boids, and a range narrow enough, that the query walks the cells: a
     range covering more cells than there are boids is scanned instead, and the
     scan reads none of the arrays a rebuild could double up */
  const boids = Array.from({ length: 30 }, (_, i) =>
    makeBoid(i, new THREE.Vector3(i - 15, 0, 0)),
  );
  boids.forEach((boid) => store.insert(boid));

  store.reindex();
  store.reindex();

  // rebuilding without clearing first leaves a stale copy of every boid per
  // rebuild: each boid becomes several of its own neighbours
  const everything = query(new THREE.Sphere(new THREE.Vector3(), CELL_SIZE));
  expect(everything.map((boid) => boid.id).sort((a, b) => a - b)).toEqual([
    13, 14, 15, 16, 17,
  ]);
  expect(new Set(everything).size).toBe(everything.length);
});
