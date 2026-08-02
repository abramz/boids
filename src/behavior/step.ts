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
 * `frameSign`, because searching the index is the expensive part of a frame and
 * the answer barely moves between two of them. Every boid then flies on that
 * answer, every frame: where a boid is changes constantly, and skipping that is
 * a visible stutter for no saving.
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
    return frameSign;
  }

  const halfSize = Math.floor(boids.length / 2);
  const start = frameSign > 0 ? 0 : halfSize;
  const end = frameSign > 0 ? halfSize : boids.length;

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

  /* every frame, not every other one: a query picks its cells from where the
     index last saw a boid and then filters on where the boid actually is, so an
     index a frame out of date drops whatever crossed a cell edge in between.
     Which half that lands on is fixed by the array order, so rebuilding on one
     frame of the pair biases the same flocks every frame, and the loss grows
     with the delta. */
  storage.reindex();

  return frameSign * -1;
}
