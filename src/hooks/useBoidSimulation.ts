import * as THREE from "three";
import { MutableRefObject, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import BoidStore from "../storage/BoidStore";
import Boid, { BoidProperties, ForceFactors } from "../behavior/Boid";
import initialize from "../behavior/initialize";
import suspend from "../helpers/suspend";
import { MouseTrackingState } from "./useMouseTracking";

const tempBoundary = new THREE.Sphere();

export interface UseBehaviorOptions {
  flockSize: number;
  flockCount: number;
  boidProperties: BoidProperties;
  forceFactors: ForceFactors;
  worldBoundary: THREE.Box3;
  storageBoundary: THREE.Box3;
  trackingStateRef: MutableRefObject<MouseTrackingState>;
  trackingTargetRef: MutableRefObject<THREE.Vector3>;
  seedX?: number[];
  seedY?: number[];
  seedZ?: number[];
  seedPhi?: number[];
  seedTheta?: number[];
  seedStorageStart?: number;
}

export default function useBoidSimulation({
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
}: UseBehaviorOptions): [BoidStore, Boid[]] {
  const perceptionRadius = useMemo(
    () => boidProperties.perceptionRadius + boidProperties.boidSize,
    [boidProperties.perceptionRadius, boidProperties.boidSize],
  );
  const desiredSeparation = useMemo(
    () => boidProperties.desiredSeparation + 2 * boidProperties.boidSize,
    [boidProperties.desiredSeparation, boidProperties.boidSize],
  );

  const storage: BoidStore = suspend(initialize, [
    flockSize,
    flockCount,
    boidProperties.maxSpeed,
    worldBoundary,
    storageBoundary,
    seedX,
    seedY,
    seedZ,
    seedPhi,
    seedTheta,
    seedStorageStart,
  ]);
  const allBoids = storage.boids; // we can get this once and use it forever since we don't create/destroy boid references after this

  /* we will only deal with half of the boids per frame */
  const frameRef = useRef<number>(1);
  useFrame((_, delta) => {
    if (delta > 1) {
      console.log("skipped excessive delta");
      return;
    }

    const halfSize = Math.floor(allBoids.length / 2);

    let boidSlice: Boid[];
    if (frameRef.current > 0) {
      boidSlice = allBoids.slice(0, halfSize);
    } else {
      boidSlice = allBoids.slice(halfSize);
    }

    /* apply forces to all boids before computing position & velocity*/
    boidSlice.forEach((boid) => {
      tempBoundary.set(boid.position, boidProperties.boidSize);
      const neighbors = storage.queryRange(tempBoundary);

      boid.applyForces({
        neighbors,
        obstacles: storage.obstacles,
        boundary: worldBoundary,
        seekTarget:
          trackingStateRef.current === MouseTrackingState.seek
            ? trackingTargetRef.current
            : undefined,
        avoidTarget:
          trackingStateRef.current === MouseTrackingState.avoid
            ? trackingTargetRef.current
            : undefined,
        properties: {
          ...boidProperties,
          perceptionRadius,
          desiredSeparation,
        },
        forceFactors,
      });
    });

    /* apply acceleration & velocity to update the boids' positions */
    boidSlice.forEach((boid) => {
      boid.applyAccleration(boidProperties.maxSpeed);
      boid.applyVelocity(delta);
    });

    // re-structure storage every other frame to balance accuracy & performance
    if (frameRef.current < 0) {
      storage.clear();
      allBoids.forEach((boid) => storage.insert(boid));
    }

    frameRef.current *= -1; // switch frames
  });

  return [storage, allBoids];
}
