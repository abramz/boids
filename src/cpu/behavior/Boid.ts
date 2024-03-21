import * as THREE from "three";
import { isInFOV, limit } from "../helpers/math";
import { Node } from "../storage/OctTree";
import Obstacle from "../obstacle/Obstacle";

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
  avoidanceFactor: number;
  seekFactor: number;
  avoidEdgesFactor: number;
};

export type BoidProperties = {
  perceptionRadius: number;
  fieldOfViewDeg: number;
  desiredSeparation: number;
  maxSpeed: number;
  maxForce: number;
  boidSize: number;
};

export interface ApplyForcesOptions {
  neighbors: Boid[];
  boundary: THREE.Box3;
  obstacles?: Obstacle[];
  seekTarget?: THREE.Vector3;
  avoidTarget?: THREE.Vector3;
  properties: BoidProperties;
  forceFactors: ForceFactors;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Head<T extends any[]> = T extends [...infer Head, any] ? Head : any[];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ForceFunction = (...args: any[]) => THREE.Vector3;

/* this is all single threaded so Boid instances can share temp variables */
const tempAveragePosition = new THREE.Vector3();
const tempAverageVelocity = new THREE.Vector3();
const tempSeparationVelocity = new THREE.Vector3();
const tempAvoidTarget = new THREE.Vector3();
const tempDiff = new THREE.Vector3();
const tempForward = new THREE.Vector3();
const tempAccelerationVector = new THREE.Vector3();
const tempSteerDirection = new THREE.Vector3();

export default class Boid implements Node {
  public readonly id: number;
  public readonly parentId: number;
  public readonly position: THREE.Vector3;
  public readonly velocity: THREE.Vector3;
  public readonly acceleration = new THREE.Vector3();
  public readonly forces: {
    alignment: THREE.Vector3Tuple;
    cohesion: THREE.Vector3Tuple;
    separation: THREE.Vector3Tuple;
    avoidance: THREE.Vector3Tuple;
    seek: THREE.Vector3Tuple;
    avoidEdges: THREE.Vector3Tuple;
    avoidObstacles: THREE.Vector3Tuple;
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
      avoidance: [0, 0, 0],
      seek: [0, 0, 0],
      avoidEdges: [0, 0, 0],
      avoidObstacles: [0, 0, 0],
    };
  }

  public get coumpundId(): string {
    return `${this.parentId}-${this.id}`;
  }

  /**
   * Apply all of the behavioral forces to determine the boids acceleration
   */
  public applyForces({
    neighbors,
    obstacles = [],
    boundary,
    seekTarget,
    avoidTarget,
    properties: {
      perceptionRadius,
      fieldOfViewDeg,
      desiredSeparation,
      maxSpeed,
      maxForce,
    },
    forceFactors,
  }: ApplyForcesOptions): void {
    this.acceleration.set(0, 0, 0);
    tempAveragePosition.set(0, 0, 0);
    tempAverageVelocity.set(0, 0, 0);
    tempSeparationVelocity.set(0, 0, 0);

    const fieldOfViewRad = fieldOfViewDeg * THREE.MathUtils.DEG2RAD;

    const [count, separationCount] = this.determineFlockingTargets(
      neighbors,
      perceptionRadius,
      fieldOfViewRad,
      desiredSeparation,
      tempAveragePosition,
      tempAverageVelocity,
      tempSeparationVelocity,
    );

    // ALIGNMENT
    if (count > 0) {
      this.determineForce(
        this.alignment,
        [tempAverageVelocity, maxSpeed, maxForce],
        forceFactors.alignmentFactor,
        this.forces.alignment,
      );
    }

    // COHESION
    if (count > 0) {
      this.determineForce(
        this.cohesion,
        [tempAveragePosition, desiredSeparation, maxSpeed, maxForce],
        forceFactors.cohesionFactor,
        this.forces.cohesion,
      );
    }

    // SEPARATION
    if (separationCount > 0) {
      this.determineForce(
        this.separation,
        [tempSeparationVelocity, maxSpeed, maxForce],
        forceFactors.separationFactor,
        this.forces.separation,
      );
    }

    // AVOID EDGES
    this.determineForce(
      this.avoidEdges,
      [boundary, desiredSeparation, maxSpeed, maxForce],
      forceFactors.avoidEdgesFactor,
      this.forces.avoidEdges,
    );

    // AVOID OBSTACLES
    this.determineForce(
      this.avoidObstacles,
      [obstacles, perceptionRadius, fieldOfViewRad, maxSpeed, maxForce],
      forceFactors.avoidEdgesFactor,
      this.forces.avoidObstacles,
    );

    // Don't do these things if we are avoiding the edges
    if (
      this.forces.avoidEdges[0] === 0 &&
      this.forces.avoidEdges[1] === 0 &&
      this.forces.avoidEdges[2] === 0
    ) {
      // AVOID
      if (
        avoidTarget &&
        Math.abs(this.position.distanceTo(avoidTarget)) < desiredSeparation * 10
      ) {
        this.determineForce(
          this.avoid,
          [avoidTarget, maxSpeed, maxForce],
          forceFactors.avoidanceFactor,
          this.forces.avoidance,
        );
      }

      // SEEK
      if (seekTarget) {
        this.determineForce(
          this.seekPosition,
          [seekTarget, desiredSeparation, maxSpeed, maxForce],
          forceFactors.seekFactor,
          this.forces.seek,
        );
      }
    }

    limit(this.acceleration, maxForce);
  }

  /**
   * apply the current accleration to the velocity
   */
  public applyAccleration(maxSpeed: number): void {
    this.velocity.add(this.acceleration);
    if (this.acceleration.length() > 0) {
      limit(this.velocity, maxSpeed);
    } else {
      this.velocity.normalize().multiplyScalar(maxSpeed); // don't let boids get stuck out on their own somewhere
    }
  }

  /**
   * apply the current velocity scaled by the time delta to position
   */
  public applyVelocity(delta: number): void {
    this.position.addScaledVector(this.velocity, delta);
  }

  /* flocking behaviors */
  public alignment = (
    averageVelocity: THREE.Vector3,
    maxSpeed: number,
    maxForce: number,
    outVector: THREE.Vector3,
  ): THREE.Vector3 => {
    return this.seekVelocity(averageVelocity, maxSpeed, maxForce, outVector);
  };

  public cohesion = (
    averagePosition: THREE.Vector3,
    desiredSeparation: number,
    maxSpeed: number,
    maxForce: number,
    outVector: THREE.Vector3,
  ): THREE.Vector3 => {
    return this.seekPosition(
      averagePosition,
      desiredSeparation,
      maxSpeed,
      maxForce,
      outVector,
    );
  };

  public separation = (
    separationVelocity: THREE.Vector3,
    maxSpeed: number,
    maxForce: number,
    outVector: THREE.Vector3,
  ): THREE.Vector3 => {
    return this.seekVelocity(separationVelocity, maxSpeed, maxForce, outVector);
  };

  /* individual behaviors */
  public avoid = (
    avoidPosition: THREE.Vector3,
    maxSpeed: number,
    maxForce: number,
    outVector: THREE.Vector3,
  ): THREE.Vector3 => {
    outVector.subVectors(this.position, avoidPosition);

    if (outVector.length() > 0) {
      limit(
        outVector.normalize().multiplyScalar(maxSpeed).sub(this.velocity),
        maxForce,
      );
    }

    return outVector;
  };

  public seekPosition = (
    targetPosition: THREE.Vector3,
    desiredSeparation: number,
    maxSpeed: number,
    maxForce: number,
    outVector: THREE.Vector3,
  ): THREE.Vector3 => {
    outVector.subVectors(targetPosition, this.position);

    if (outVector.length() > desiredSeparation) {
      limit(
        outVector.normalize().multiplyScalar(maxSpeed).sub(this.velocity),
        maxForce,
      );
    } else {
      outVector.set(0, 0, 0);
    }

    return outVector;
  };

  public seekVelocity = (
    targetVelocity: THREE.Vector3,
    maxSpeed: number,
    maxForce: number,
    outVector: THREE.Vector3,
  ): THREE.Vector3 => {
    limit(
      outVector
        .copy(targetVelocity)
        .normalize()
        .multiplyScalar(maxSpeed)
        .sub(this.velocity),
      maxForce,
    );

    return outVector;
  };

  public avoidEdges = (
    boundary: THREE.Box3,
    offset: number,
    maxSpeed: number,
    maxForce: number,
    outVector: THREE.Vector3,
  ): THREE.Vector3 => {
    (["x", "y", "z"] as ["x", "y", "z"]).forEach((axis) => {
      tempAvoidTarget.copy(this.position);
      if (this.position[axis] < boundary.min[axis] + offset) {
        tempAvoidTarget[axis] -= 15;
        this.avoid(tempAvoidTarget, maxSpeed, maxForce, outVector);
      } else if (this.position[axis] > boundary.max[axis] - offset) {
        tempAvoidTarget[axis] += 15;
        this.avoid(tempAvoidTarget, maxSpeed, maxForce, outVector);
      }
    });

    return outVector;
  };

  public avoidObstacles = (
    obstacles: Obstacle[],
    perceptionRadius: number,
    fieldOfViewRad: number,
    maxSpeed: number,
    maxForce: number,
    outVector: THREE.Vector3,
  ): THREE.Vector3 => {
    tempForward.copy(this.velocity).normalize();
    obstacles.forEach((obstacle) => {
      tempDiff.subVectors(obstacle.position, this.position);
      const distance = tempDiff.length();
      tempDiff.normalize();

      if (distance > perceptionRadius + obstacle.radius) {
        return; // too far away to care
      }
      if (distance > 0 && !isInFOV(tempDiff, tempForward, fieldOfViewRad)) {
        return; // out of field of view
      }
      // get a perpendicular direction
      tempSteerDirection.crossVectors(tempForward, tempDiff).normalize();
      const side = tempForward.dot(tempSteerDirection);
      tempSteerDirection
        .crossVectors(
          side > 0 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, -1, 0),
          tempDiff,
        )
        .normalize();

      this.seekVelocity(tempSteerDirection, maxSpeed, maxForce, outVector);
    });
    return outVector;
  };

  public determineFlockingTargets(
    neighbors: Boid[],
    perceptionRadius: number,
    fieldOfViewRad: number,
    desiredSeparation: number,
    /* OUT */ outAveragePosition: THREE.Vector3,
    /* OUT */ outAverageVelocity: THREE.Vector3,
    /* OUT */ outSeparationVelocity: THREE.Vector3,
  ): [number, number] {
    let count = 0;
    let separationCount = 0;
    for (const neighbor of neighbors) {
      if (neighbor.coumpundId === this.coumpundId) {
        continue; // no-op if this boid was passed itself as a neighbor
      }

      const otherPosition = neighbor.position;
      const otherVelocity = neighbor.velocity;
      const otherParent = neighbor.parentId;

      tempDiff.subVectors(otherPosition, this.position);
      const distance = tempDiff.length();

      if (distance > perceptionRadius) {
        continue; // out of range
      }

      tempForward.copy(this.velocity).normalize();
      tempDiff.normalize();
      // only check field of fiew if the boids aren't on top of each other, isinFOV will return false but we want them to separate
      if (distance > 0 && !isInFOV(tempDiff, tempForward, fieldOfViewRad)) {
        continue; // out of field of view
      }

      if (this.parentId === otherParent) {
        // align & cohesion only with same flock
        outAveragePosition.add(otherPosition);
        outAverageVelocity.add(otherVelocity);
        count++;
      }

      if (distance < desiredSeparation) {
        tempDiff.multiplyScalar(-1);
        const distSq = Math.max(distance * distance, 0.0000001); // make sure we consider neighbors that are in our exact position
        outSeparationVelocity.addScaledVector(tempDiff, 1 / distSq);
        separationCount++;
      }
    }

    if (count > 0) {
      outAveragePosition.divideScalar(count);
      outAverageVelocity.divideScalar(count);
    }
    if (separationCount > 0) {
      outSeparationVelocity.divideScalar(separationCount);
    }

    return [count, separationCount];
  }

  protected determineForce<T extends ForceFunction>(
    forceFunction: T,
    parameters: Head<Parameters<T>>,
    forceFactor: number,
    forcePersistence: [number, number, number],
  ) {
    tempAccelerationVector.set(0, 0, 0);

    forceFunction(...parameters, tempAccelerationVector);
    tempAccelerationVector.multiplyScalar(forceFactor);

    this.acceleration.add(tempAccelerationVector);

    forcePersistence[0] = tempAccelerationVector.x;
    forcePersistence[1] = tempAccelerationVector.y;
    forcePersistence[2] = tempAccelerationVector.z;
  }
}
