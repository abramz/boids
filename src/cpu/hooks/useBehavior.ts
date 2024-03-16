import * as THREE from "three";
import { MutableRefObject, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import BoidStore from "../storage/BoidStore";
import {
  ALIGNMENT_FACTOR,
  AVOIDANCE_FACTOR,
  AVOID_EDGES_FACTOR,
  COHESION_FACTOR,
  DESIRED_SEPARATION,
  FIELD_OF_VIEW_DEG,
  FLOCK_COUNT,
  FLOCK_SIZE,
  MAX_FORCE,
  MAX_SPEED,
  PERCEPTION_RADIUS,
  SEEK_FACTOR,
  SEPARATION_FACTOR,
} from "../config";
import Boid, { BoidProperties, ForceFactors } from "../behavior/Boid";
import initialize from "../behavior/initialize";
import suspend from "../helpers/suspend";
import useForceFactors from "./useForceFactors";
import useBoidProperties from "./useBoidProperties";
import { MouseTrackingState } from "./useMouseTracking";

const tempBoundary = new THREE.Sphere();

export default function useBehavior(
  boidRadius: number,
  worldBoundary: THREE.Box3,
  storageBoundary: THREE.Box3,
  trackingStateRef: MutableRefObject<MouseTrackingState>,
  trackingTargetRef: MutableRefObject<THREE.Vector3>,
): [BoidStore, Boid[], BoidProperties, ForceFactors] {
  const properties = useBoidProperties({
    perceptionRadius: PERCEPTION_RADIUS,
    fieldOfViewDeg: FIELD_OF_VIEW_DEG,
    desiredSeparation: DESIRED_SEPARATION,
    maxSpeed: MAX_SPEED,
    maxForce: MAX_FORCE,
  });
  const forceFactors = useForceFactors({
    alignmentFactor: ALIGNMENT_FACTOR,
    cohesionFactor: COHESION_FACTOR,
    separationFactor: SEPARATION_FACTOR,
    avoidanceFactor: AVOIDANCE_FACTOR,
    seekFactor: SEEK_FACTOR,
    avoidEdgesFactor: AVOID_EDGES_FACTOR,
  });

  const perceptionRadius = useMemo(
    () => properties.perceptionRadius + boidRadius,
    [properties.perceptionRadius, boidRadius],
  );
  const desiredSeparation = useMemo(
    () => properties.desiredSeparation + boidRadius,
    [properties.desiredSeparation, boidRadius],
  );

  const storage: BoidStore = suspend(initialize, [
    FLOCK_SIZE,
    FLOCK_COUNT,
    properties.maxSpeed,
    worldBoundary,
    storageBoundary,
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
      tempBoundary.set(boid.position, boidRadius);
      const neighbors = storage.queryRange(tempBoundary);

      boid.applyForces({
        neighbors,
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
          ...properties,
          perceptionRadius,
          desiredSeparation,
        },
        forceFactors,
      });
    });

    /* apply acceleration & velocity to update the boids' positions */
    boidSlice.forEach((boid) => {
      boid.applyAccleration(properties.maxSpeed);
      boid.applyVelocity(delta);
    });

    // re-structure storage every other frame to balance accuracy & performance
    if (frameRef.current < 0) {
      storage.clear();
      allBoids.forEach((boid) => storage.insert(boid));
    }

    frameRef.current *= -1; // switch frames
  });

  return [storage, allBoids, properties, forceFactors];
}
