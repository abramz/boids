import * as THREE from "three";
import { ReactNode, useMemo } from "react";
import { BOID_RADIUS, OCT_TREE_BOUNDARY_SCALE } from "../config";
import useBehavior from "../hooks/useBehavior";
import useMouseTracking from "../hooks/useMouseTracking";
import Helpers from "./Helpers";
import Boids from "./Boids";

export interface SimulationProps {
  worldBoundary: THREE.Box3;
}

export default function Simulation({
  worldBoundary,
}: SimulationProps): ReactNode {
  const storageBoundary = useMemo(
    () => worldBoundary.clone().expandByScalar(OCT_TREE_BOUNDARY_SCALE),
    [worldBoundary],
  );
  const { trackingStateRef, trackingTargetRef } = useMouseTracking();
  const [storage, boids] = useBehavior(
    BOID_RADIUS,
    worldBoundary,
    storageBoundary,
    trackingStateRef,
    trackingTargetRef,
  );

  return (
    <>
      <Helpers
        worldBoundary={worldBoundary}
        storageBoundary={storageBoundary}
        storage={storage}
        trackingStateRef={trackingStateRef}
        trackingTargetRef={trackingTargetRef}
      />
      <Boids boidRadius={BOID_RADIUS} boids={boids} />
    </>
  );
}
