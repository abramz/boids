import * as THREE from "three";
import { bench, describe } from "vitest";
import * as config from "../../config";
import { seededRandom } from "../../__fixtures__/seededRandom";
import Boid, { BoidProperties, ForceFactors } from "../Boid";
import Candidates from "../../storage/Candidates";
import createSimulation from "../createSimulation";
import deriveBoidProperties from "../deriveBoidProperties";

/**
 * Where a frame's time goes at the scale the fastest machines earn.
 *
 * Nothing here asserts: `vitest bench` runs it and `vitest run` does not, so it
 * stays out of CI and out of the coverage gate. It exists so that a change to
 * the index is argued with numbers rather than with reasoning about it.
 *
 * The flock is settled before anything is measured. Boids are scattered
 * uniformly at random to begin with, and uniform is the easy case for any
 * spatial index; the load worth measuring is the clumped one flocking produces.
 */

/** One frame at 60fps. */
const FRAME_DELTA = 1 / 60;

/** Long enough for the flocks to have found each other and packed together. */
const SETTLE_STEPS = 240;

const PROPERTIES: BoidProperties = {
  perceptionRadius: config.PERCEPTION_RADIUS,
  fieldOfViewDeg: config.FIELD_OF_VIEW_DEG,
  desiredSeparation: config.DESIRED_SEPARATION,
  neighbourLimit: config.NEIGHBOUR_LIMIT,
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
const candidates = new Candidates<Boid>();

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
    simulation.storage.reindex();
  });

  /* the whole flock, where a frame queries half of it, so this is two frames'
     worth of neighbour search with the flying either side of it left out */
  bench("query, whole flock", () => {
    for (const boid of simulation.boids) {
      simulation.storage.queryRange(
        range.set(boid.position, derived.perceptionRadius),
        candidates,
      );
    }
  });
});
