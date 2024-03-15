import * as THREE from "three";
import { MutableRefObject, useMemo, useRef } from "react";
import useBoidProperties from "./useBoidProperties";
import useForceFactors from "./useForceFactors";
import BoidStore from "../storage/BoidStore";
import OctTree from "../storage/OctTree";
import {
  FLOCK_COUNT,
  FLOCK_SIZE,
  OCT_TREE_BOUNDARY_SCALE,
  OCT_TREE_CAPACITY,
} from "../config";
import Boid from "../behavior/Boid";
import { useFrame } from "@react-three/fiber";
import initialize from "../behavior/initialize";

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
): MutableRefObject<BoidStore> {
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

  const storageRef = useRef<BoidStore>();
  if (!storageRef.current) {
    storageRef.current = new BoidStore(
      new OctTree<Boid>(
        worldBoundary.clone().expandByScalar(OCT_TREE_BOUNDARY_SCALE),
        OCT_TREE_CAPACITY,
      ),
    );

    initialize(
      FLOCK_SIZE,
      FLOCK_COUNT,
      properties.maxSpeed,
      worldBoundary,
      storageRef.current,
    );
  }

  /* we will only deal with half of the boids per frame */
  const frameRef = useRef<number>(1);
  useFrame((_, delta) => {
    if (!storageRef.current) {
      return;
    }

    if (delta > 1) {
      console.log("skipped excessive delta");
      return;
    }

    const allBoids = storageRef.current.boids;
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
      const neighbors = storageRef.current!.queryRange(tempBoundary);
      boid.applyForces({
        neighbors,
        boundary: worldBoundary,
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
      storageRef.current.clear();
      allBoids.forEach((boid) => storageRef.current!.insert(boid));
    }

    frameRef.current *= -1; // switch frames
  });

  return storageRef as MutableRefObject<BoidStore>; // we know that the ref was initialized
}
