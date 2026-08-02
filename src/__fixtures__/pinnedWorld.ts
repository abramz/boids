import { BoidProperties } from "../behavior/Boid";
import { CreateSimulationOptions } from "../behavior/createSimulation";
import { queriedRadius } from "../behavior/deriveBoidProperties";

/** The world's shape beyond its size and the flock in it. */
export type PinnedWorld = Pick<
  CreateSimulationOptions,
  | "gridCellSize"
  | "gridBucketsPerBoid"
  | "obstacleOffset"
  | "obstacleRadiusScale"
  | "maxDelta"
>;

/**
 * What a fixture's world holds still at, pinned here rather than defaulted from
 * config so retuning production moves the flock and not the suites.
 *
 * The cell size is the perception radius as deriveBoidProperties widens it,
 * which is the radius actually queried and so the cell size that costs least.
 * Derived here, so retuning the properties passed in cannot leave a fixture
 * querying an index sized for the old ones.
 */
export function pinnedWorld(properties: BoidProperties): PinnedWorld {
  return {
    gridCellSize: queriedRadius(
      properties.perceptionRadius,
      properties.boidSize,
    ),
    gridBucketsPerBoid: 4,
    obstacleOffset: 0.5,
    obstacleRadiusScale: 1 / 24,
    maxDelta: 0.25,
  };
}
