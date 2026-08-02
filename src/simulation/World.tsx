import { ReactNode, useLayoutEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import useBoidSimulation from "../hooks/useBoidSimulation";
import { BoidProperties, ForceFactors } from "../behavior/Boid";
import { CreateSimulationOptions } from "../behavior/createSimulation";
import * as config from "../config";
import useBoidProperties from "../hooks/useBoidProperties";
import useForceFactors from "../hooks/useForceFactors";
import useWorldSize from "../hooks/useWorldSize";
import { cameraDistance } from "../theme";
import ObstacleDisplay from "../obstacle/ObstacleDisplay";
import Boids from "./Boids";
import Helpers from "./Helpers";

export interface InternalWorldProps {
  world: CreateSimulationOptions;
  properties: BoidProperties;
  forceFactors: ForceFactors;
}

export const GROUP_NAME = "World";

export function InternalWorld({
  world,
  properties,
  forceFactors,
}: InternalWorldProps): ReactNode {
  const simulation = useBoidSimulation({ world, properties, forceFactors });

  return (
    <group name={GROUP_NAME}>
      <Helpers
        worldBoundary={simulation.worldBoundary}
        occupiedCells={simulation.occupiedCells}
      />
      <Boids boidSize={properties.boidSize} boids={simulation.boids} />
      <ObstacleDisplay obstacles={simulation.obstacles} />
    </group>
  );
}

export default function World(): ReactNode {
  const camera = useThree((state) => state.camera);
  const { flockSize, worldSize } = useWorldSize();

  useLayoutEffect(() => {
    camera.position.z = cameraDistance(worldSize);
  }, [camera, worldSize]);

  const properties = useBoidProperties(worldSize, {
    perceptionRadius: config.PERCEPTION_RADIUS,
    fieldOfViewDeg: config.FIELD_OF_VIEW_DEG,
    desiredSeparation: config.DESIRED_SEPARATION,
    neighborLimit: config.NEIGHBOR_LIMIT,
    minSpeed: config.MIN_SPEED,
    maxSpeed: config.MAX_SPEED,
    maxForce: config.MAX_FORCE,
    boidSize: config.BOID_SIZE,
  });

  const forceFactors = useForceFactors({
    alignmentFactor: config.ALIGNMENT_FACTOR,
    cohesionFactor: config.COHESION_FACTOR,
    separationFactor: config.SEPARATION_FACTOR,
    avoidEdgesFactor: config.AVOID_EDGES_FACTOR,
    avoidObstaclesFactor: config.AVOID_OBSTACLES_FACTOR,
    drawToCenterFactor: config.DRAW_TO_CENTER_FACTOR,
  });

  const world = useMemo(
    () => ({
      flockSize,
      flockCount: config.FLOCK_COUNT,
      worldSize,
      maxSpeed: config.MAX_SPEED,
    }),
    [flockSize, worldSize],
  );

  return (
    <InternalWorld
      world={world}
      properties={properties}
      forceFactors={forceFactors}
    />
  );
}
