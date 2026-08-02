import * as THREE from "three";
import { expect, it } from "vitest";
import { seededRandom } from "../../__fixtures__/seededRandom";
import QueryResults from "../../storage/QueryResults";
import Boid from "../Boid";
import createSimulation from "../createSimulation";
import { FLOCKING_CONFIG, FRAME_DELTA } from "./helpers/simulate";

function build() {
  return createSimulation({
    flockSize: FLOCKING_CONFIG.flockSize,
    flockCount: FLOCKING_CONFIG.flockCount,
    worldSize: FLOCKING_CONFIG.worldSize,
    maxSpeed: FLOCKING_CONFIG.properties.maxSpeed,
    random: seededRandom(),
    ...FLOCKING_CONFIG.world,
  });
}

it("holds the flock in one array for the life of the simulation", () => {
  const simulation = build();
  const before = simulation.boids;

  for (let step = 0; step < 4; step++) {
    simulation.step({
      delta: FRAME_DELTA,
      properties: FLOCKING_CONFIG.properties,
      forceFactors: FLOCKING_CONFIG.forceFactors,
    });
  }

  expect(simulation.boids).toBe(before);
  expect(simulation.boids).toHaveLength(
    FLOCKING_CONFIG.flockSize * FLOCKING_CONFIG.flockCount,
  );
});

it("indexes the flock as it is built, before a frame has run", () => {
  const simulation = build();
  const [first] = simulation.boids;

  const range = new THREE.Sphere(first.position.clone(), 1);
  const found = new QueryResults<Boid>();
  simulation.grid.queryRange(range, found);

  const ids = (boids: readonly Boid[]) =>
    boids.map((boid) => boid.id).sort((a, b) => a - b);

  expect(ids([...found])).toEqual(
    ids(simulation.boids.filter((boid) => range.containsPoint(boid.position))),
  );
  expect([...found]).toContain(first);
});
