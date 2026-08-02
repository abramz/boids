import * as THREE from "three";
import { bench, describe } from "vitest";
import * as config from "../../config";
import { seededRandom } from "../../__fixtures__/seededRandom";
import Boid, { BoidProperties, ForceFactors } from "../Boid";
import QueryResults from "../../storage/QueryResults";
import createSimulation from "../createSimulation";
import deriveBoidProperties from "../deriveBoidProperties";

const FRAME_DELTA = 1 / 60;

const SETTLE_STEPS = 240;

const PROPERTIES: BoidProperties = {
  perceptionRadius: config.PERCEPTION_RADIUS,
  fieldOfViewDeg: config.FIELD_OF_VIEW_DEG,
  desiredSeparation: config.DESIRED_SEPARATION,
  neighborLimit: config.NEIGHBOR_LIMIT,
  minSpeed: config.MIN_SPEED,
  maxSpeed: config.MAX_SPEED,
  maxForce: config.MAX_FORCE,
  boidSize: config.BOID_SIZE,
};

const FORCE_FACTORS: ForceFactors = {
  alignmentFactor: config.ALIGNMENT_FACTOR,
  cohesionFactor: config.COHESION_FACTOR,
  separationFactor: config.SEPARATION_FACTOR,
  avoidEdgesFactor: config.AVOID_EDGES_FACTOR,
  avoidObstaclesFactor: config.AVOID_OBSTACLES_FACTOR,
  drawToCenterFactor: config.DRAW_TO_CENTER_FACTOR,
};

const simulation = createSimulation({
  flockSize: config.FLOCK_SIZE,
  flockCount: config.FLOCK_COUNT,
  worldSize: config.WORLD_SIZE,
  maxSpeed: config.MAX_SPEED,
  random: seededRandom(),
});

for (let step = 0; step < SETTLE_STEPS; step++) {
  simulation.step({
    delta: FRAME_DELTA,
    properties: PROPERTIES,
    forceFactors: FORCE_FACTORS,
  });
}

const derived = deriveBoidProperties(PROPERTIES);
const range = new THREE.Sphere();
const found = new QueryResults<Boid>();

describe(`frame, ${config.FLOCK_SIZE * config.FLOCK_COUNT} boids`, () => {
  bench("step", () => {
    simulation.step({
      delta: FRAME_DELTA,
      properties: PROPERTIES,
      forceFactors: FORCE_FACTORS,
    });
  });
});

describe(`index, ${config.FLOCK_SIZE * config.FLOCK_COUNT} boids`, () => {
  bench("rebuild", () => {
    simulation.grid.build(simulation.boids);
  });

  bench("query, whole flock", () => {
    for (const boid of simulation.boids) {
      simulation.grid.queryRange(
        range.set(boid.position, derived.perceptionRadius),
        found,
      );
    }
  });
});
