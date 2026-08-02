import * as THREE from "three";
import { limit } from "../helpers/math";
import Obstacle from "../obstacle/Obstacle";

const tempDiff = new THREE.Vector3();
const tempForward = new THREE.Vector3();
const tempDesired = new THREE.Vector3();
const tempSteer = new THREE.Vector3();
const tempCenter = new THREE.Vector3();
const tempSize = new THREE.Vector3();

const UP = new THREE.Vector3(0, 1, 0);
const SIDEWAYS = new THREE.Vector3(1, 0, 0);
const DEGENERATE_CROSS_SQ = 1e-6;

const AXES = ["x", "y", "z"] as const;

export function seekVelocity(
  velocity: THREE.Vector3,
  targetVelocity: THREE.Vector3,
  maxSpeed: number,
  maxForce: number,
  outVector: THREE.Vector3,
): THREE.Vector3 {
  if (targetVelocity.lengthSq() === 0) {
    return outVector.set(0, 0, 0);
  }

  limit(
    outVector
      .copy(targetVelocity)
      .normalize()
      .multiplyScalar(maxSpeed)
      .sub(velocity),
    maxForce,
  );

  return outVector;
}

export function seekPosition(
  position: THREE.Vector3,
  velocity: THREE.Vector3,
  targetPosition: THREE.Vector3,
  easeRadius: number,
  maxSpeed: number,
  maxForce: number,
  outVector: THREE.Vector3,
): THREE.Vector3 {
  outVector.subVectors(targetPosition, position);
  const distance = outVector.length();

  if (distance === 0) {
    return outVector.set(0, 0, 0);
  }

  limit(outVector.normalize().multiplyScalar(maxSpeed).sub(velocity), maxForce);

  return outVector.multiplyScalar(Math.min(1, distance / easeRadius));
}

export function avoidEdges(
  position: THREE.Vector3,
  velocity: THREE.Vector3,
  boundary: THREE.Box3,
  margin: number,
  maxSpeed: number,
  maxForce: number,
  outVector: THREE.Vector3,
): THREE.Vector3 {
  outVector.set(0, 0, 0);

  for (const axis of AXES) {
    const fromMin = position[axis] - boundary.min[axis];
    const fromMax = boundary.max[axis] - position[axis];

    if (fromMin >= margin && fromMax >= margin) {
      continue;
    }

    tempDesired.set(0, 0, 0);
    tempDesired[axis] = fromMin <= fromMax ? 1 : -1;

    outVector.add(
      seekVelocity(velocity, tempDesired, maxSpeed, maxForce, tempSteer),
    );
  }

  return outVector;
}

export function drawToCenter(
  position: THREE.Vector3,
  velocity: THREE.Vector3,
  boundary: THREE.Box3,
  maxSpeed: number,
  maxForce: number,
  outVector: THREE.Vector3,
): THREE.Vector3 {
  const strayed = boundary.distanceToPoint(position);
  if (strayed === 0) {
    return outVector.set(0, 0, 0);
  }

  boundary.getCenter(tempCenter);
  boundary.getSize(tempSize);

  seekVelocity(
    velocity,
    tempDesired.subVectors(tempCenter, position),
    maxSpeed,
    maxForce,
    outVector,
  );

  return outVector.multiplyScalar(
    strayed / Math.max(tempSize.x, tempSize.y, tempSize.z),
  );
}

export function avoidObstacles(
  position: THREE.Vector3,
  velocity: THREE.Vector3,
  obstacles: readonly Obstacle[],
  perceptionRadius: number,
  maxSpeed: number,
  maxForce: number,
  outVector: THREE.Vector3,
): THREE.Vector3 {
  outVector.set(0, 0, 0);
  tempForward.copy(velocity).normalize();

  for (const obstacle of obstacles) {
    tempDiff.subVectors(obstacle.position, position);
    const distance = tempDiff.length();

    if (distance > perceptionRadius + obstacle.radius) {
      continue;
    }
    tempDiff.normalize();
    if (tempDiff.dot(tempForward) <= 0) {
      continue;
    }

    tempDesired.crossVectors(UP, tempDiff);
    if (tempDesired.lengthSq() < DEGENERATE_CROSS_SQ) {
      tempDesired.crossVectors(SIDEWAYS, tempDiff);
    }
    tempDesired.normalize();
    if (tempDesired.dot(tempForward) < 0) {
      tempDesired.negate();
    }

    const closeness = THREE.MathUtils.clamp(
      1 - (distance - obstacle.radius) / perceptionRadius,
      0,
      1,
    );
    const urgency = closeness * closeness;
    tempDesired.multiplyScalar(1 - urgency).addScaledVector(tempDiff, -urgency);

    outVector.add(
      seekVelocity(velocity, tempDesired, maxSpeed, maxForce, tempSteer),
    );
  }

  return outVector;
}
