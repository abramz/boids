import * as THREE from "three";
import { ReactNode, useMemo } from "react";
import { OCT_TREE_BOUNDARY_SCALE } from "../config";
import useBoidSimulation from "../hooks/useBoidSimulation";
import useMouseTracking from "../hooks/useMouseTracking";
import { BoidProperties, ForceFactors } from "../behavior/Boid";
import Helpers from "./Helpers";
import Boids from "./Boids";

export interface WorldProps {
  flockSize: number;
  flockCount: number;
  boidProperties: BoidProperties;
  forceFactors: ForceFactors;
  worldBoundary: THREE.Box3;
}

export interface InternalWorldProps extends WorldProps {
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
  seedX,
  seedY,
  seedZ,
  seedPhi,
  seedTheta,
  seedStorageStart,
}: InternalWorldProps): ReactNode {
  const storageBoundary = useMemo(
    () => worldBoundary.clone().expandByScalar(OCT_TREE_BOUNDARY_SCALE),
    [worldBoundary],
  );
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
    </group>
  );
}

export default function World(props: WorldProps): ReactNode {
  return <InternalWorld {...props} />;
}
