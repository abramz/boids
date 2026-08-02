import * as THREE from "three";
import { BoidProperties, DerivedBoidProperties } from "./Boid";

/**
 * The radius a boid actually queries the index over.
 *
 * The index is sized against this rather than against `perceptionRadius`: a
 * cell of the narrower one is a hair too small, and a hair too small is a whole
 * extra ring of cells on every side.
 */
export function queriedRadius(
  perceptionRadius: number,
  boidSize: number,
): number {
  return perceptionRadius + boidSize;
}

/**
 * Fill in the properties that follow from the configured ones.
 *
 * The radii widen because boids have a size: one perceives another once its
 * surface is in range, and separation is measured surface to surface.
 *
 * `edgeMargin` is a runway rather than a spacing: `maxSpeed^2 / (2 * maxForce)`
 * plus the boid's own reach, which is what it takes to stop dead. A boid held
 * above `minSpeed` turns instead of stopping, and turning takes twice that, so
 * this is where avoidance starts pushing rather than a promise that no boid
 * crosses the wall. What has crossed is the leash's problem.
 */
export default function deriveBoidProperties(
  properties: BoidProperties,
): DerivedBoidProperties {
  const {
    perceptionRadius,
    fieldOfViewDeg,
    desiredSeparation,
    boidSize,
    maxSpeed,
    maxForce,
  } = properties;

  return {
    ...properties,
    perceptionRadius: queriedRadius(perceptionRadius, boidSize),
    desiredSeparation: desiredSeparation + 2 * boidSize,
    edgeMargin: (maxSpeed * maxSpeed) / (2 * maxForce) + boidSize,
    cosHalfFieldOfView: Math.cos(
      (fieldOfViewDeg * THREE.MathUtils.DEG2RAD) / 2,
    ),
  };
}
