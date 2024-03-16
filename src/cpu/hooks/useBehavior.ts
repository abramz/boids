import * as THREE from "three";
import { MutableRefObject, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import BoidStore from "../storage/BoidStore";
import OctTree from "../storage/OctTree";
import { FLOCK_COUNT, FLOCK_SIZE, OCT_TREE_CAPACITY } from "../config";
import Boid from "../behavior/Boid";
import initialize from "../behavior/initialize";
import useForceFactors from "./useForceFactors";
import useBoidProperties from "./useBoidProperties";
import { MouseTrackingState } from "./useMouseTracking";

const PERCEPTION_RADIUS = 5;
const FIELD_OF_VIEW_DEG = 230;
const DESIRED_SEPARATION = 1;
const MAX_SPEED = 15;
const MAX_FORCE = 0.8;

const ALIGNMENT_FACTOR = 1.0;
const COHESION_FACTOR = 1.0;
const SEPARATION_FACTOR = 1.0;
const AVOIDANCE_FACTOR = 1.0;
const SEEK_FACTOR = 1.0;
const AVOID_EDGES_FACTOR = 50.0;

const tempBoundary = new THREE.Sphere();

export default function useBehavior(
  boidRadius: number,
  worldBoundary: THREE.Box3,
  storageBoundary: THREE.Box3,
  trackingStateRef: MutableRefObject<MouseTrackingState>,
  trackingTargetRef: MutableRefObject<THREE.Vector3>,
): BoidStore {
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

  const storage = useMemo<BoidStore>(() => {
    const s = new BoidStore(
      new OctTree<Boid>(storageBoundary, OCT_TREE_CAPACITY),
    );

    initialize(FLOCK_SIZE, FLOCK_COUNT, properties.maxSpeed, worldBoundary, s);

    return s;
  }, [worldBoundary, storageBoundary, properties.maxSpeed]);

  /* we will only deal with half of the boids per frame */
  const frameRef = useRef<number>(1);
  useFrame((_, delta) => {
    if (delta > 1) {
      console.log("skipped excessive delta");
      return;
    }

    const allBoids = storage.boids;
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

  return storage;
}
