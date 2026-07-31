import * as THREE from "three";
import BoidStore from "../storage/BoidStore";
import Candidates from "../storage/Candidates";
import Boid, { DerivedBoidProperties, ForceFactors } from "./Boid";

/* this is all single threaded so steps can share a temp variable */
const tempBoundary = new THREE.Sphere();
const tempNeighbours = new Candidates<Boid>();

export interface StepSimulationOptions {
  storage: BoidStore;
  boids: readonly Boid[];
  /** +1 or -1; selects which half of the flock re-reads its neighbourhood */
  frameSign: number;
  /** seconds elapsed since the previous frame */
  delta: number;
  /** deltas above this are dropped rather than integrated */
  maxDelta: number;
  properties: DerivedBoidProperties;
  forceFactors: ForceFactors;
  worldBoundary: THREE.Box3;
}

/**
 * Advance the simulation by one frame.
 *
 * Half the flock works out what it wants to do per frame, alternating by
 * `frameSign`, because searching the index for neighbours is the expensive part
 * of a frame and the answer barely moves between two of them. Every boid then
 * flies on that answer, every frame: what a boid steers towards changes slowly,
 * but where it is changes constantly, and skipping it every other frame is a
 * visible stutter for no saving.
 *
 * Storage is rebuilt on the negative half-frame, so the index stays roughly
 * accurate without being rebuilt twice per pair.
 *
 * @returns the `frameSign` to use on the next frame
 */
export default function stepSimulation({
  storage,
  boids,
  frameSign,
  delta,
  maxDelta,
  properties,
  forceFactors,
  worldBoundary,
}: StepSimulationOptions): number {
  if (delta > maxDelta) {
    /* the frame is dropped rather than integrated, so the flock holds still
       instead of jumping to where it would have been */
    return frameSign;
  }

  const halfSize = Math.floor(boids.length / 2);
  const start = frameSign > 0 ? 0 : halfSize;
  const end = frameSign > 0 ? halfSize : boids.length;

  /* half the flock re-reads its neighbourhood and re-aims */
  for (let index = start; index < end; index++) {
    const boid = boids[index];
    tempBoundary.set(boid.position, properties.perceptionRadius);
    storage.queryRange(tempBoundary, tempNeighbours);

    boid.applyForces({
      neighbors: tempNeighbours,
      obstacles: storage.obstacles,
      boundary: worldBoundary,
      properties,
      forceFactors,
    });
  }

  /* and the whole flock flies, on whichever answer it has. A boid holds its
     acceleration between re-aims, so integrating it against this frame's delta
     lands on the same velocity by the time it re-aims, reached smoothly */
  for (const boid of boids) {
    boid.applyAcceleration(delta, properties.minSpeed, properties.maxSpeed);
    boid.applyVelocity(delta);
  }

  if (frameSign < 0) {
    storage.reindex();
  }

  return frameSign * -1;
}
