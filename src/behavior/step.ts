import * as THREE from "three";
import BoidStore from "../storage/BoidStore";
import Boid, { BoidProperties, ForceFactors } from "./Boid";

/* this is all single threaded so steps can share a temp variable */
const tempBoundary = new THREE.Sphere();

/** Frame deltas above this are discarded rather than integrated. */
export const MAX_DELTA = 1;

export interface StepSimulationOptions {
  storage: BoidStore;
  boids: Boid[];
  /** +1 or -1; selects which half of the flock is updated this frame */
  frameSign: number;
  /** seconds elapsed since the previous frame */
  delta: number;
  properties: BoidProperties;
  forceFactors: ForceFactors;
  worldBoundary: THREE.Box3;
}

/**
 * Advance the simulation by one frame.
 *
 * Only half the flock is updated per frame, alternating by `frameSign`, and
 * storage is rebuilt on the negative half-frame so the OctTree stays roughly
 * accurate without being rebuilt twice per pair.
 *
 * @returns the `frameSign` to use on the next frame
 */
export default function stepSimulation({
  storage,
  boids,
  frameSign,
  delta,
  properties,
  forceFactors,
  worldBoundary,
}: StepSimulationOptions): number {
  if (delta > MAX_DELTA) {
    console.log("skipped excessive delta");

    return frameSign;
  }

  const halfSize = Math.floor(boids.length / 2);
  const boidSlice =
    frameSign > 0 ? boids.slice(0, halfSize) : boids.slice(halfSize);

  /* apply forces to all boids before computing position & velocity */
  boidSlice.forEach((boid) => {
    // OctTree.queryRange returns every boid in the cells the sphere touches
    // without filtering them, so a radius below perceptionRadius silently
    // narrows the candidates to the boid's own cell rather than returning none
    tempBoundary.set(boid.position, properties.perceptionRadius);

    boid.applyForces({
      neighbors: storage.queryRange(tempBoundary),
      obstacles: storage.obstacles,
      boundary: worldBoundary,
      properties,
      forceFactors,
    });
  });

  /* apply acceleration & velocity to update the boids' positions */
  const storageBoundary = storage.boundary;
  boidSlice.forEach((boid) => {
    boid.applyAccleration(properties.maxSpeed);
    boid.applyVelocity(delta);
    // BoidStore.insert throws for a boid outside the tree, and a large delta
    // can integrate further than avoidEdges is able to steer back
    boid.position.clamp(storageBoundary.min, storageBoundary.max);
  });

  // re-structure storage every other frame to balance accuracy & performance
  if (frameSign < 0) {
    storage.clear();
    boids.forEach((boid) => storage.insert(boid));
  }

  return frameSign * -1; // switch frames
}
