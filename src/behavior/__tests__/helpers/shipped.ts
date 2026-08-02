import * as config from "../../../config";
import { queriedRadius } from "../../deriveBoidProperties";
import { SimulationConfig } from "./simulate";

/**
 * The values config.ts actually ships, at a flock small enough to fly in a test.
 *
 * The world is shrunk with the flock the way useWorldSize.ts shrinks it for a
 * machine that cannot carry the full one, so the density, and every radius and
 * rate, are the shipped ones. Distances therefore scale with `WORLD_SIZE` and
 * are best asserted as multiples of it rather than in absolute units.
 */
export const FLOCK_SIZE = 50;
export const WORLD_SIZE =
  config.WORLD_SIZE * Math.cbrt(FLOCK_SIZE / config.FLOCK_SIZE);

/** Ten seconds at 60fps, by which the flock has long since settled. */
export const SETTLED_STEPS = 600;

export const SHIPPED: SimulationConfig = {
  flockSize: FLOCK_SIZE,
  flockCount: config.FLOCK_COUNT,
  worldSize: WORLD_SIZE,
  properties: {
    perceptionRadius: config.PERCEPTION_RADIUS,
    fieldOfViewDeg: config.FIELD_OF_VIEW_DEG,
    desiredSeparation: config.DESIRED_SEPARATION,
    neighbourLimit: config.NEIGHBOUR_LIMIT,
    minSpeed: config.MIN_SPEED,
    maxSpeed: config.MAX_SPEED,
    maxForce: config.MAX_FORCE,
    boidSize: config.BOID_SIZE,
  },
  forceFactors: {
    alignmentFactor: config.ALIGNMENT_FACTOR,
    cohesionFactor: config.COHESION_FACTOR,
    separationFactor: config.SEPARATION_FACTOR,
    avoidEdgesFactor: config.AVOID_EDGES_FACTOR,
    avoidObstaclesFactor: config.AVOID_OBSTACLES_FACTOR,
    drawToCenterFactor: config.DRAW_TO_CENTER_FACTOR,
  },
  world: {
    gridCellSize: queriedRadius(config.PERCEPTION_RADIUS, config.BOID_SIZE),
    gridBucketsPerBoid: config.GRID_BUCKETS_PER_BOID,
    obstacleOffset: config.OBSTACLE_OFFSET,
    obstacleRadiusScale: config.OBSTACLE_RADIUS_SCALE,
    maxDelta: config.MAX_DELTA,
  },
};
