import * as THREE from "three";
import { ReactNode, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { useDetectGPU } from "@react-three/drei";
import useBoidSimulation from "../hooks/useBoidSimulation";
import useMouseTracking from "../hooks/useMouseTracking";
import { BoidProperties, ForceFactors } from "../behavior/Boid";
import * as config from "../config";
import useBoidProperties from "../hooks/useBoidProperties";
import useForceFactors from "../hooks/useForceFactors";
import ObstacleDisplay from "../obstacle/ObstacleDisplay";
import Boids from "./Boids";
import Helpers from "./Helpers";

export interface InternalWorldProps {
  flockSize: number;
  flockCount: number;
  boidProperties: BoidProperties;
  forceFactors: ForceFactors;
  worldBoundary: THREE.Box3;
  storageBoundary: THREE.Box3;
  seedX?: number[];
  seedY?: number[];
  seedZ?: number[];
  seedPhi?: number[];
  seedTheta?: number[];
  seedStorageStart?: number;
}

export const GROUP_NAME = "World";

export function InternalWorld({
  flockSize,
  flockCount,
  boidProperties,
  forceFactors,
  worldBoundary,
  storageBoundary,
  seedX,
  seedY,
  seedZ,
  seedPhi,
  seedTheta,
  seedStorageStart,
}: InternalWorldProps): ReactNode {
  const { trackingStateRef, trackingTargetRef } = useMouseTracking();
  const [storage, boids] = useBoidSimulation({
    flockSize,
    flockCount,
    boidProperties,
    forceFactors,
    worldBoundary,
    storageBoundary,
    trackingStateRef,
    trackingTargetRef,
    seedX,
    seedY,
    seedZ,
    seedPhi,
    seedTheta,
    seedStorageStart,
  });

  return (
    <group name={GROUP_NAME}>
      <Helpers
        worldBoundary={worldBoundary}
        storageBoundary={storageBoundary}
        storage={storage}
        trackingStateRef={trackingStateRef}
        trackingTargetRef={trackingTargetRef}
      />
      <Boids boidSize={boidProperties.boidSize} boids={boids} />
      <ObstacleDisplay obstacles={storage.obstacles} />
    </group>
  );
}

export default function World(): ReactNode {
  const camera = useThree((state) => state.camera);
  const glContext = useThree((state) => state.gl.getContext());
  const gpuResult = useDetectGPU({ glContext });

  const defaults = useMemo(() => {
    // this has seemed like a good benchmark for flock size
    const flockSize = Math.min(
      gpuResult.fps ?? config.FLOCK_SIZE,
      config.FLOCK_SIZE,
    );
    const worldSize = Math.max(
      1,
      config.WORLD_SIZE * (flockSize / config.FLOCK_SIZE),
    );
    const scale = worldSize / config.WORLD_SIZE;

    camera.position.z = worldSize / 2;

    return {
      flockSize,
      worldSize,
      perceptionRadius: config.PERCEPTION_RADIUS * scale,
      desiredSeparation: config.DESIRED_SEPARATION * scale,
      maxSpeed: config.MAX_SPEED * scale,
      maxForce: config.MAX_FORCE * scale,
      boidSize: config.BOID_SIZE * scale,
    };
  }, [gpuResult, camera]);

  const [worldBoundary, storageBoundary] = useMemo(() => {
    const halfSize = defaults.worldSize / 2;

    const boundary = new THREE.Box3(
      new THREE.Vector3(-halfSize, -halfSize, -halfSize),
      new THREE.Vector3(halfSize, halfSize, halfSize),
    );
    return [
      boundary,
      boundary.clone().expandByScalar(config.OCT_TREE_BOUNDARY_SCALE),
    ];
  }, [defaults]);

  const boidProperties = useBoidProperties({
    perceptionRadius: defaults.perceptionRadius,
    fieldOfViewDeg: config.FIELD_OF_VIEW_DEG,
    desiredSeparation: defaults.desiredSeparation,
    maxSpeed: defaults.maxSpeed,
    maxForce: defaults.maxForce,
    boidSize: defaults.boidSize,
  });

  const forceFactors = useForceFactors({
    alignmentFactor: config.ALIGNMENT_FACTOR,
    cohesionFactor: config.COHESION_FACTOR,
    separationFactor: config.SEPARATION_FACTOR,
    avoidanceFactor: config.AVOIDANCE_FACTOR,
    seekFactor: config.SEEK_FACTOR,
    avoidEdgesFactor: config.AVOID_EDGES_FACTOR,
  });

  return (
    <InternalWorld
      flockSize={defaults.flockSize}
      flockCount={config.FLOCK_COUNT}
      boidProperties={boidProperties}
      forceFactors={forceFactors}
      worldBoundary={worldBoundary}
      storageBoundary={storageBoundary}
    />
  );
}
