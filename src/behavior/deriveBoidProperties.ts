import * as THREE from "three";
import { BoidProperties, DerivedBoidProperties } from "./Boid";

export function queriedRadius(
  perceptionRadius: number,
  boidSize: number,
): number {
  return perceptionRadius + boidSize;
}

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
