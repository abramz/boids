import * as THREE from "three";
import { limit } from "../helpers/math";
import Obstacle from "../obstacle/Obstacle";

/**
 * The steering behaviours, as functions of where a boid is and where it is
 * going. Each writes its answer into an out vector and returns it.
 *
 * Free of Boid on purpose: none of them needs a boid's identity or its flock,
 * only its position and heading, and a behaviour that can be exercised without
 * building one is a behaviour whose tests do not have to reach through a class
 * to get at it.
 */

/* single threaded, so every boid is steered through the same scratch */
const tempDiff = new THREE.Vector3();
const tempForward = new THREE.Vector3();
const tempDesired = new THREE.Vector3();
const tempSteer = new THREE.Vector3();
const tempCenter = new THREE.Vector3();
const tempSize = new THREE.Vector3();

/* the axis avoidObstacles turns around, and a stand-in for when an obstacle
   sits along it and the cross product carries no direction */
const UP = new THREE.Vector3(0, 1, 0);
const SIDEWAYS = new THREE.Vector3(1, 0, 0);
const DEGENERATE_CROSS_SQ = 1e-6;

const AXES = ["x", "y", "z"] as const;

/**
 * Steer towards flying along `targetVelocity` at full speed.
 *
 * A zero-length target is no preference rather than a target of standing still:
 * normalising it would give a direction of nowhere, and steering towards that
 * is a full-strength brake.
 */
export function seekVelocity(
  velocity: THREE.Vector3,
  targetVelocity: THREE.Vector3,
  maxSpeed: number,
  maxForce: number,
  /* OUT */ outVector: THREE.Vector3,
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

/**
 * Steer towards flying at `targetPosition`, or nowhere if it is already closer
 * than `desiredSeparation`.
 */
export function seekPosition(
  position: THREE.Vector3,
  velocity: THREE.Vector3,
  targetPosition: THREE.Vector3,
  desiredSeparation: number,
  maxSpeed: number,
  maxForce: number,
  /* OUT */ outVector: THREE.Vector3,
): THREE.Vector3 {
  outVector.subVectors(targetPosition, position);

  if (outVector.length() > desiredSeparation) {
    limit(
      outVector.normalize().multiplyScalar(maxSpeed).sub(velocity),
      maxForce,
    );
  } else {
    outVector.set(0, 0, 0);
  }

  return outVector;
}

/**
 * Steer back in off every wall within `margin`, not just the last one checked,
 * so a boid heading into a corner turns out of it diagonally.
 */
export function avoidEdges(
  position: THREE.Vector3,
  velocity: THREE.Vector3,
  boundary: THREE.Box3,
  margin: number,
  maxSpeed: number,
  maxForce: number,
  /* OUT */ outVector: THREE.Vector3,
): THREE.Vector3 {
  outVector.set(0, 0, 0);

  for (const axis of AXES) {
    const fromMin = position[axis] - boundary.min[axis];
    const fromMax = boundary.max[axis] - position[axis];

    if (fromMin >= margin && fromMax >= margin) {
      continue;
    }

    /* away from the nearer wall rather than off whichever side was tested
       first: a margin wider than the world, which a low enough maxForce
       derives, puts a boid inside both at once and an ordered test would steer
       the whole flock into the far one */
    tempDesired.set(0, 0, 0);
    tempDesired[axis] = fromMin <= fromMax ? 1 : -1;

    /* seekVelocity assigns to its out vector, so accumulating needs a scratch */
    outVector.add(
      seekVelocity(velocity, tempDesired, maxSpeed, maxForce, tempSteer),
    );
  }

  return outVector;
}

/**
 * Steer home, from outside the boundary only.
 *
 * Zero while a boid is inside it, so this is no part of how the flock flies and
 * all of whether it comes back. Outside, it grows with how far a boid has
 * strayed, and it does not have to beat `maxForce` to do its job: it only has
 * to take over the direction of what is summed, after which the limit on the
 * total aims the whole budget home.
 *
 * Edge avoidance is the behaviour that turns a boid at a wall, and it is
 * tunable down to nothing. This is the one that is not: the index has no outer
 * wall to catch a flock that has slipped its edges, so something has to.
 *
 * Spherical where edge avoidance is three axis-aligned pushes, which is the
 * shape that suits a leash rather than a wall.
 */
export function drawToCenter(
  position: THREE.Vector3,
  velocity: THREE.Vector3,
  boundary: THREE.Box3,
  maxSpeed: number,
  maxForce: number,
  /* OUT */ outVector: THREE.Vector3,
): THREE.Vector3 {
  /* zero inside the box, and the distance to it outside */
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

  /* a world's width out is parity with an ordinary steering force, and it
     climbs from there, so there is no distance this can be outrun at */
  return outVector.multiplyScalar(
    strayed / Math.max(tempSize.x, tempSize.y, tempSize.z),
  );
}

/**
 * Steer around every obstacle ahead, not just the last one checked.
 *
 * The turn is horizontally tangential far out, so a boid carries its momentum
 * around an obstacle rather than reversing across its face, and swings out to
 * straight away from it as the surface closes. A pure tangent has no component
 * away from the obstacle at all, and leaves a boid grazing into one it is
 * already turning around.
 *
 * Only obstacles the boid is closing on count. Steering by tangent alone puts
 * `-velocity . toObstacle` into the force, which for an obstacle already behind
 * the boid is a push back towards it.
 */
export function avoidObstacles(
  position: THREE.Vector3,
  velocity: THREE.Vector3,
  obstacles: readonly Obstacle[],
  perceptionRadius: number,
  maxSpeed: number,
  maxForce: number,
  /* OUT */ outVector: THREE.Vector3,
): THREE.Vector3 {
  outVector.set(0, 0, 0);
  tempForward.copy(velocity).normalize();

  for (const obstacle of obstacles) {
    tempDiff.subVectors(obstacle.position, position);
    const distance = tempDiff.length();

    if (distance > perceptionRadius + obstacle.radius) {
      continue; // too far away to care
    }
    tempDiff.normalize();
    if (tempDiff.dot(tempForward) <= 0) {
      continue; // behind, or exactly abeam: flying past it, not into it
    }

    tempDesired.crossVectors(UP, tempDiff);
    if (tempDesired.lengthSq() < DEGENERATE_CROSS_SQ) {
      // obstacle directly above or below, where every horizontal turn is
      // equivalent, so any axis not parallel to it will do
      tempDesired.crossVectors(SIDEWAYS, tempDiff);
    }
    tempDesired.normalize();
    if (tempDesired.dot(tempForward) < 0) {
      tempDesired.negate();
    }

    /* squared rather than linear so the turn stays tangential across most of
       the approach and only swings outward as the surface closes; ramped
       straight the outward half swamps the tangent at every useful range and a
       boid meets an obstacle head on instead of carrying around it */
    const closeness = THREE.MathUtils.clamp(
      1 - (distance - obstacle.radius) / perceptionRadius,
      0,
      1,
    );
    const urgency = closeness * closeness;
    tempDesired.multiplyScalar(1 - urgency).addScaledVector(tempDiff, -urgency);

    /* seekVelocity assigns to its out vector, so accumulating needs a scratch */
    outVector.add(
      seekVelocity(velocity, tempDesired, maxSpeed, maxForce, tempSteer),
    );
  }

  return outVector;
}
