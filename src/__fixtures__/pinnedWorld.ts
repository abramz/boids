import { BoidProperties } from "../behavior/Boid";
import { CreateSimulationOptions } from "../behavior/createSimulation";
import { queriedRadius } from "../behavior/deriveBoidProperties";

export type PinnedWorld = Pick<
  CreateSimulationOptions,
  | "gridCellSize"
  | "gridBucketsPerBoid"
  | "obstacleOffset"
  | "obstacleRadiusScale"
  | "maxDelta"
>;

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
