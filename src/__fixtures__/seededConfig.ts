import { BoidProperties, ForceFactors } from "../behavior/Boid";
import { CreateSimulationOptions } from "../behavior/createSimulation";
import { pinnedWorld } from "./pinnedWorld";
import { seededRandom } from "./seededRandom";

export const FLOCK_SIZE = 10;
export const FLOCK_COUNT = 5;
export const WORLD_SIZE = 6;

export const BOID_PROPERTIES: BoidProperties = {
  perceptionRadius: 2,
  fieldOfViewDeg: 230,
  desiredSeparation: 1,
  neighborLimit: 8,
  minSpeed: 2.5,
  maxSpeed: 5,
  maxForce: 9,
  boidSize: 0.1,
};

export const FORCE_FACTORS: ForceFactors = {
  alignmentFactor: 1.01,
  cohesionFactor: 1.02,
  separationFactor: 1.03,
  avoidEdgesFactor: 50.01,
  avoidObstaclesFactor: 50.02,
  drawToCenterFactor: 1.04,
};

export function seededWorld(): CreateSimulationOptions {
  return {
    flockSize: FLOCK_SIZE,
    flockCount: FLOCK_COUNT,
    worldSize: WORLD_SIZE,
    maxSpeed: BOID_PROPERTIES.maxSpeed,
    random: seededRandom(),
    ...pinnedWorld(BOID_PROPERTIES),
  };
}
