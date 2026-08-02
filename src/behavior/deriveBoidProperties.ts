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
 * The radii widen to account for boids having a size: a boid perceives another
 * once its surface is in range, and separation is measured surface to surface.
 *
 * `edgeMargin` is where edge avoidance starts, and it is a braking distance
 * rather than a spacing: turning around under the hardest steer it has takes a
 * boid `maxSpeed^2 / (2 * maxForce)`, and it overruns the wall by whatever it
 * is given short of that.
 *
 * `cosHalfFieldOfView` is what the field of view is actually compared against,
 * so it is worked out here rather than by every boid that re-aims. It goes
 * negative past 180 degrees, which the comparison handles without a case.
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
