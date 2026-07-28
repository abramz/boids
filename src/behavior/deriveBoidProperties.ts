import { BoidProperties } from "./Boid";

/**
 * Widen the configured radii to account for boids having a size: a boid
 * perceives another once its surface is in range, and separation is measured
 * surface to surface.
 */
export default function deriveBoidProperties(
  properties: BoidProperties,
): BoidProperties {
  return {
    ...properties,
    perceptionRadius: properties.perceptionRadius + properties.boidSize,
    desiredSeparation: properties.desiredSeparation + 2 * properties.boidSize,
  };
}
