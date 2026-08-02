import * as THREE from "three";
import { isInFOV, limit } from "../helpers/math";
import Obstacle from "../obstacle/Obstacle";
import {
  avoidEdges,
  avoidObstacles,
  drawToCenter,
  seekPosition,
  seekVelocity,
} from "./steering";
import NearestNeighbours from "./NearestNeighbours";
import type { Node } from "../storage/Node";

/**
 * What the behaviour layer needs of whatever collected its neighbours. The
 * buffer is the caller's, filled by the index through an out parameter, so
 * taking this narrower view of it is what keeps the kernel from pushing to or
 * resetting a buffer it does not own.
 */
export interface NeighbourList<T> {
  readonly size: number;
  at(index: number): T;
}

export interface BoidOptions {
  id: number;
  parentId: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
}

export type ForceFactors = {
  alignmentFactor: number;
  cohesionFactor: number;
  separationFactor: number;
  avoidEdgesFactor: number;
  avoidObstaclesFactor: number;
  drawToCenterFactor: number;
};

export type BoidProperties = {
  perceptionRadius: number;
  fieldOfViewDeg: number;
  desiredSeparation: number;
  /**
   * How many neighbours a boid flocks with, taken nearest first. A radius alone
   * hands it however many the local crowding happens to put in range, and the
   * steering forces read the mean of that set as if it were a firm preference.
   */
  neighbourLimit: number;
  /** Boids do not hover; this is the speed they fall back to when idle. */
  minSpeed: number;
  maxSpeed: number;
  maxForce: number;
  boidSize: number;
};

/**
 * What a boid actually flies on, from deriveBoidProperties.ts. The simulation
 * takes this rather than `BoidProperties` so that deriving is a step the type
 * system asks for rather than one every call site has to remember.
 */
export type DerivedBoidProperties = BoidProperties & {
  /** How far from a wall edge avoidance starts steering. */
  edgeMargin: number;
  /** What `fieldOfViewDeg` is compared as, cosined once rather than per boid. */
  cosHalfFieldOfView: number;
};

export interface ApplyForcesOptions {
  neighbors: NeighbourList<Boid>;
  boundary: THREE.Box3;
  obstacles?: readonly Obstacle[];
  properties: DerivedBoidProperties;
  forceFactors: ForceFactors;
}

/**
 * How many neighbours the flocking forces found to steer by. A force with none
 * is skipped rather than steered on, so these are what say which of them ran.
 * Filled into a caller's object rather than returned, like the vectors
 * alongside them, since this is read for every re-aiming boid every frame.
 */
export interface FlockingCounts {
  /** Alignment and cohesion both steer by these, so they share a count. */
  flockmates: number;
  separation: number;
}

/* this is all single threaded so Boid instances can share temp variables */
const tempAveragePosition = new THREE.Vector3();
const tempAverageVelocity = new THREE.Vector3();
const tempSeparationVelocity = new THREE.Vector3();
const tempDiff = new THREE.Vector3();
const tempForward = new THREE.Vector3();
const tempForce = new THREE.Vector3();

/* one neighbourhood for the boid's own flock and one for everything around
   it, reused between boids like the vectors above */
const nearestFlockmates = new NearestNeighbours<Boid>();
const nearestAnyone = new NearestNeighbours<Boid>();
const tempCounts: FlockingCounts = { flockmates: 0, separation: 0 };

/* a boid with no velocity at all has no heading to hold, so it needs one from
   somewhere rather than sitting still forever */
const COAST_HEADING = new THREE.Vector3(0, 0, 1);

function clearForce(force: THREE.Vector3Tuple): void {
  force[0] = 0;
  force[1] = 0;
  force[2] = 0;
}

export default class Boid implements Node {
  public readonly id: number;
  public readonly parentId: number;
  public readonly position: THREE.Vector3;
  public readonly velocity: THREE.Vector3;
  public readonly acceleration = new THREE.Vector3();
  /** What each behaviour last contributed. Nothing in the app reads it; it is
   *  how the behaviour tests see which forces a frame actually engaged. */
  public readonly forces: {
    alignment: THREE.Vector3Tuple;
    cohesion: THREE.Vector3Tuple;
    separation: THREE.Vector3Tuple;
    avoidEdges: THREE.Vector3Tuple;
    avoidObstacles: THREE.Vector3Tuple;
    drawToCenter: THREE.Vector3Tuple;
  };

  constructor({ id, parentId, position, velocity }: BoidOptions) {
    this.id = id;
    this.parentId = parentId;
    this.position = position;
    this.velocity = velocity;
    this.forces = {
      alignment: [0, 0, 0],
      cohesion: [0, 0, 0],
      separation: [0, 0, 0],
      avoidEdges: [0, 0, 0],
      avoidObstacles: [0, 0, 0],
      drawToCenter: [0, 0, 0],
    };
  }

  public get compoundId(): string {
    return `${this.parentId}-${this.id}`;
  }

  /**
   * Apply all of the behavioral forces to determine the boids acceleration
   */
  public applyForces({
    neighbors,
    obstacles = [],
    boundary,
    properties: {
      perceptionRadius,
      cosHalfFieldOfView,
      desiredSeparation,
      neighbourLimit,
      edgeMargin,
      maxSpeed,
      maxForce,
    },
    forceFactors,
  }: ApplyForcesOptions): void {
    this.acceleration.set(0, 0, 0);
    /* the flocking forces below are skipped outright when nothing is in range,
       so clear them here or they report the last frame a flockmate was seen */
    clearForce(this.forces.alignment);
    clearForce(this.forces.cohesion);
    clearForce(this.forces.separation);

    this.determineFlockingTargets(
      neighbors,
      perceptionRadius,
      cosHalfFieldOfView,
      desiredSeparation,
      neighbourLimit,
      tempAveragePosition,
      tempAverageVelocity,
      tempSeparationVelocity,
      tempCounts,
    );

    if (tempCounts.flockmates > 0) {
      // ALIGNMENT: fly the way the neighbourhood is already going
      seekVelocity(
        this.velocity,
        tempAverageVelocity,
        maxSpeed,
        maxForce,
        tempForce,
      );
      this.accumulate(
        forceFactors.alignmentFactor,
        this.forces.alignment,
        tempForce,
      );

      // COHESION: close on where the neighbourhood is, but no nearer than it
      // wants to be to any one of them
      seekPosition(
        this.position,
        this.velocity,
        tempAveragePosition,
        desiredSeparation,
        maxSpeed,
        maxForce,
        tempForce,
      );
      this.accumulate(
        forceFactors.cohesionFactor,
        this.forces.cohesion,
        tempForce,
      );
    }

    if (tempCounts.separation > 0) {
      // SEPARATION: away from the crowd, weighted towards the nearest of it
      seekVelocity(
        this.velocity,
        tempSeparationVelocity,
        maxSpeed,
        maxForce,
        tempForce,
      );
      this.accumulate(
        forceFactors.separationFactor,
        this.forces.separation,
        tempForce,
      );
    }

    avoidEdges(
      this.position,
      this.velocity,
      boundary,
      edgeMargin,
      maxSpeed,
      maxForce,
      tempForce,
    );
    this.accumulate(
      forceFactors.avoidEdgesFactor,
      this.forces.avoidEdges,
      tempForce,
    );

    avoidObstacles(
      this.position,
      this.velocity,
      obstacles,
      perceptionRadius,
      maxSpeed,
      maxForce,
      tempForce,
    );
    this.accumulate(
      forceFactors.avoidObstaclesFactor,
      this.forces.avoidObstacles,
      tempForce,
    );

    drawToCenter(
      this.position,
      this.velocity,
      boundary,
      maxSpeed,
      maxForce,
      tempForce,
    );
    this.accumulate(
      forceFactors.drawToCenterFactor,
      this.forces.drawToCenter,
      tempForce,
    );

    limit(this.acceleration, maxForce);
  }

  /**
   * Apply the current acceleration to the velocity over `delta` seconds.
   *
   * Acceleration is in units per second squared, so the delta has to be carried
   * through here as well as into `applyVelocity`; integrating it raw would make
   * how hard a boid can steer a function of the frame rate.
   *
   * Speed is held above `minSpeed` as well as under `maxSpeed`. Steering is a
   * force budget, so a boid turns through `maxForce / speed` radians a second:
   * cohesion and separation oppose each other in a packed flock and the balance
   * between them settles at a crawl, where that budget becomes a spin.
   */
  public applyAcceleration(
    delta: number,
    minSpeed: number,
    maxSpeed: number,
  ): void {
    this.velocity.addScaledVector(this.acceleration, delta);

    const speed = this.velocity.length();
    if (speed === 0) {
      /* no heading left to hold, so pick one rather than sit there forever */
      this.velocity.copy(COAST_HEADING).multiplyScalar(minSpeed);
      return;
    }

    this.velocity.multiplyScalar(
      THREE.MathUtils.clamp(speed, minSpeed, maxSpeed) / speed,
    );
  }

  /**
   * apply the current velocity scaled by the time delta to position
   */
  public applyVelocity(delta: number): void {
    this.position.addScaledVector(this.velocity, delta);
  }

  /**
   * Work out what this boid's neighbourhood wants it to do.
   *
   * Two neighbourhoods, each capped at `neighbourLimit`: its own flock, which
   * alignment and cohesion read, and everything around it, which separation
   * reads. Sharing one would let a boid surrounded by other flocks find nothing
   * to fly with, and capping is what makes the answer independent of how
   * crowded the world happens to be. Uncapped, a boid in a dense patch averages
   * every heading in range, and the more of them there are the more they
   * cancel, leaving a weak consensus that the steering forces then act on at
   * full strength, since seekVelocity normalises whatever it is handed.
   *
   * Real flocks work the same way round: starlings track a fixed number of
   * nearest birds rather than everything within a distance (Ballerini et al.,
   * 2008), which is what keeps a flock coherent as it compresses and spreads.
   */
  public determineFlockingTargets(
    neighbors: NeighbourList<Boid>,
    perceptionRadius: number,
    cosHalfFieldOfView: number,
    desiredSeparation: number,
    neighbourLimit: number,
    /* OUT */ outAveragePosition: THREE.Vector3,
    /* OUT */ outAverageVelocity: THREE.Vector3,
    /* OUT */ outSeparationVelocity: THREE.Vector3,
    /* OUT */ outCounts: FlockingCounts,
  ): void {
    outAveragePosition.set(0, 0, 0);
    outAverageVelocity.set(0, 0, 0);
    outSeparationVelocity.set(0, 0, 0);
    nearestFlockmates.reset(neighbourLimit);
    nearestAnyone.reset(neighbourLimit);
    tempForward.copy(this.velocity).normalize();

    for (let index = 0; index < neighbors.size; index++) {
      const neighbor = neighbors.at(index);
      /* storage hands back everything in range, this boid included */
      if (neighbor === this) {
        continue;
      }

      tempDiff.subVectors(neighbor.position, this.position);
      const distance = tempDiff.length();

      if (distance > perceptionRadius) {
        continue; // out of range
      }

      tempDiff.normalize();
      /* a neighbour exactly on top of this boid leaves no direction to test the
         field of view against, so skip the test rather than let a zero vector
         decide it */
      if (distance > 0 && !isInFOV(tempDiff, tempForward, cosHalfFieldOfView)) {
        continue; // out of field of view
      }

      nearestAnyone.offer(neighbor, distance);
      if (this.parentId === neighbor.parentId) {
        nearestFlockmates.offer(neighbor, distance);
      }
    }

    const flockmateCount = nearestFlockmates.size;
    for (let index = 0; index < flockmateCount; index++) {
      const flockmate = nearestFlockmates.at(index);
      outAveragePosition.add(flockmate.position);
      outAverageVelocity.add(flockmate.velocity);
    }
    if (flockmateCount > 0) {
      outAveragePosition.divideScalar(flockmateCount);
      outAverageVelocity.divideScalar(flockmateCount);
    }

    let separationCount = 0;
    for (let index = 0; index < nearestAnyone.size; index++) {
      const distance = nearestAnyone.distanceAt(index);
      if (distance >= desiredSeparation) {
        continue;
      }

      /* nearer neighbours pull the direction harder. Only the direction
         survives - seekVelocity normalises this - so there is nothing to
         divide by the count afterwards.
         A neighbour in this boid's exact position leaves a zero-length
         direction, where 1/0 would scale it to NaN and poison the accumulator
         for the rest of the run. It pushes nowhere either way. */
      const distSq = Math.max(distance * distance, 1e-7);
      tempDiff
        .subVectors(nearestAnyone.at(index).position, this.position)
        .normalize();
      outSeparationVelocity.addScaledVector(tempDiff, -1 / distSq);
      separationCount++;
    }

    outCounts.flockmates = flockmateCount;
    outCounts.separation = separationCount;
  }

  /** Scale a behaviour's steering into the acceleration, and record it. */
  protected accumulate(
    forceFactor: number,
    /* OUT */ forcePersistence: THREE.Vector3Tuple,
    force: THREE.Vector3,
  ): void {
    force.multiplyScalar(forceFactor);

    this.acceleration.add(force);

    forcePersistence[0] = force.x;
    forcePersistence[1] = force.y;
    forcePersistence[2] = force.z;
  }
}
