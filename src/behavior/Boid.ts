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
import NearestNeighbors from "./NearestNeighbors";
import type { Node } from "../storage/Node";

export interface NeighborList<T> {
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
  neighborLimit: number;
  minSpeed: number;
  maxSpeed: number;
  maxForce: number;
  boidSize: number;
};

export type DerivedBoidProperties = BoidProperties & {
  edgeMargin: number;
  cosHalfFieldOfView: number;
};

export interface ApplyForcesOptions {
  neighbors: NeighborList<Boid>;
  boundary: THREE.Box3;
  obstacles?: readonly Obstacle[];
  properties: DerivedBoidProperties;
  forceFactors: ForceFactors;
}

export interface FlockingCounts {
  flockmates: number;
  separation: number;
}

const tempAveragePosition = new THREE.Vector3();
const tempAverageVelocity = new THREE.Vector3();
const tempSeparationVelocity = new THREE.Vector3();
const tempDiff = new THREE.Vector3();
const tempForward = new THREE.Vector3();
const tempForce = new THREE.Vector3();

const nearestFlockmates = new NearestNeighbors<Boid>();
const nearestAnyone = new NearestNeighbors<Boid>();
const tempCounts: FlockingCounts = { flockmates: 0, separation: 0 };

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

  public applyForces({
    neighbors,
    obstacles = [],
    boundary,
    properties: {
      perceptionRadius,
      cosHalfFieldOfView,
      desiredSeparation,
      neighborLimit,
      edgeMargin,
      maxSpeed,
      maxForce,
    },
    forceFactors,
  }: ApplyForcesOptions): void {
    this.acceleration.set(0, 0, 0);
    clearForce(this.forces.alignment);
    clearForce(this.forces.cohesion);
    clearForce(this.forces.separation);

    this.determineFlockingTargets(
      neighbors,
      perceptionRadius,
      cosHalfFieldOfView,
      desiredSeparation,
      neighborLimit,
      tempAveragePosition,
      tempAverageVelocity,
      tempSeparationVelocity,
      tempCounts,
    );

    if (tempCounts.flockmates > 0) {
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

    if (forceFactors.avoidEdgesFactor === 0) {
      clearForce(this.forces.avoidEdges);
    } else {
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
    }

    if (forceFactors.avoidObstaclesFactor === 0) {
      clearForce(this.forces.avoidObstacles);
    } else {
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
    }

    if (forceFactors.drawToCenterFactor === 0) {
      clearForce(this.forces.drawToCenter);
    } else {
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
    }

    limit(this.acceleration, maxForce);
  }

  public applyAcceleration(
    delta: number,
    minSpeed: number,
    maxSpeed: number,
  ): void {
    this.velocity.addScaledVector(this.acceleration, delta);

    const speed = this.velocity.length();
    if (speed === 0) {
      this.velocity.copy(COAST_HEADING).multiplyScalar(minSpeed);
      return;
    }

    this.velocity.multiplyScalar(
      THREE.MathUtils.clamp(speed, minSpeed, maxSpeed) / speed,
    );
  }

  public applyVelocity(delta: number): void {
    this.position.addScaledVector(this.velocity, delta);
  }

  public determineFlockingTargets(
    neighbors: NeighborList<Boid>,
    perceptionRadius: number,
    cosHalfFieldOfView: number,
    desiredSeparation: number,
    neighborLimit: number,
    outAveragePosition: THREE.Vector3,
    outAverageVelocity: THREE.Vector3,
    outSeparationVelocity: THREE.Vector3,
    outCounts: FlockingCounts,
  ): void {
    outAveragePosition.set(0, 0, 0);
    outAverageVelocity.set(0, 0, 0);
    outSeparationVelocity.set(0, 0, 0);
    nearestFlockmates.reset(neighborLimit);
    nearestAnyone.reset(neighborLimit);

    const hasHeading = this.velocity.lengthSq() > 0;
    if (hasHeading) {
      tempForward.copy(this.velocity).normalize();
    }

    for (let index = 0; index < neighbors.size; index++) {
      const neighbor = neighbors.at(index);
      if (neighbor === this) {
        continue;
      }

      tempDiff.subVectors(neighbor.position, this.position);
      const distance = tempDiff.length();

      if (distance > perceptionRadius) {
        continue;
      }

      tempDiff.normalize();
      if (
        hasHeading &&
        distance > 0 &&
        !isInFOV(tempDiff, tempForward, cosHalfFieldOfView)
      ) {
        continue;
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

  protected accumulate(
    forceFactor: number,
    forcePersistence: THREE.Vector3Tuple,
    force: THREE.Vector3,
  ): void {
    force.multiplyScalar(forceFactor);

    this.acceleration.add(force);

    forcePersistence[0] = force.x;
    forcePersistence[1] = force.y;
    forcePersistence[2] = force.z;
  }
}
