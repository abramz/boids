import { BoidProperties, ForceFactors } from "../behavior/Boid";
import { CreateSimulationOptions } from "../behavior/createSimulation";
import { pinnedWorld } from "./pinnedWorld";
import { seededRandom } from "./seededRandom";

/**
 * Small enough to record and diff by hand, dense enough that the flocking
 * forces fire.
 *
 * A flock of five scattered through a world of ten never puts a boid within
 * range of one of its own, so a fixture recorded there pins the edge, obstacle
 * and leash forces and nothing else: all three flocking forces can be deleted
 * and the trajectory holds. Ten to a flock in a world of six is what brings a
 * boid's own flock into range often enough for the recording to move when
 * flocking does.
 */
export const FLOCK_SIZE = 10;
export const FLOCK_COUNT = 5;
export const WORLD_SIZE = 6;

export const BOID_PROPERTIES: BoidProperties = {
  perceptionRadius: 2,
  /* production's, rather than a narrower one no configuration ships: the field
     of view decides most of what a boid ends up flocking with */
  fieldOfViewDeg: 230,
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
  drawToCenterFactor: 1.04,
};

/**
 * The world the goldens were recorded against.
 *
 * Every number is pinned here rather than read from config.ts, so the fixtures
 * move when behaviour changes and hold still when production is retuned: an
 * obstacle lattice tuned for a 75-unit world would otherwise re-place the
 * obstacles this small one flies around.
 */
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
