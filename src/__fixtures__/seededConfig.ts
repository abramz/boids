import * as THREE from "three";
import { BoidProperties, ForceFactors } from "../behavior/Boid";
import { CreateSimulationOptions } from "../behavior/createSimulation";
import { Random } from "../helpers/math";

export const FLOCK_SIZE = 5;
export const FLOCK_COUNT = 5;
export const WORLD_SIZE = 10;
export const SEED = 123321;

export const BOID_PROPERTIES: BoidProperties = {
  perceptionRadius: 2,
  fieldOfViewDeg: 110,
  desiredSeparation: 1,
  neighbourLimit: 8,
  minSpeed: 2.5,
  maxSpeed: 5,
  /* units per second squared, like config.MAX_FORCE */
  maxForce: 9,
  boidSize: 0.1,
};

export const FORCE_FACTORS: ForceFactors = {
  alignmentFactor: 1.01,
  cohesionFactor: 1.02,
  separationFactor: 1.03,
  avoidEdgesFactor: 50.01,
  avoidObstaclesFactor: 50.02,
};

/**
 * A deterministic source of randomness for the fixtures.
 *
 * three seeds a single module-level generator, so this is one sequence per
 * process: calling it again restarts the sequence that every generator already
 * handed out is drawing from.
 */
export function seededRandom(seed: number = SEED): Random {
  THREE.MathUtils.seededRandom(seed);

  return () => THREE.MathUtils.seededRandom();
}

/**
 * The world the goldens were recorded against.
 *
 * Every number is pinned here rather than read from config.ts, so the fixtures
 * move when behaviour changes and hold still when production is retuned: an
 * obstacle lattice tuned for a 75-unit world would otherwise silently re-place
 * the obstacles this 10-unit one flies around.
 */
export function seededWorld(): CreateSimulationOptions {
  return {
    flockSize: FLOCK_SIZE,
    flockCount: FLOCK_COUNT,
    worldSize: WORLD_SIZE,
    maxSpeed: BOID_PROPERTIES.maxSpeed,
    random: seededRandom(),
    storageMargin: 0.9,
    octTreeCapacity: 8,
    octTreeMaxDepth: 8,
    obstacleOffset: 0.5,
    obstacleRadiusScale: 1 / 24,
  };
}
