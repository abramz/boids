import { describe, expect, it } from "vitest";
import { BoidProperties } from "../Boid";
import deriveBoidProperties from "../deriveBoidProperties";

const PROPERTIES: BoidProperties = {
  perceptionRadius: 3,
  fieldOfViewDeg: 230,
  desiredSeparation: 1,
  neighbourLimit: 8,
  minSpeed: 5,
  maxSpeed: 10,
  maxForce: 20,
  boidSize: 0.2,
};

describe("deriveBoidProperties", () => {
  it("widens perception by a boid's own reach", () => {
    // a boid perceives another once its surface is in range, and boidSize is
    // read as a radius throughout
    expect(deriveBoidProperties(PROPERTIES).perceptionRadius).toBeCloseTo(
      3.2,
      12,
    );
  });

  it("measures separation surface to surface", () => {
    // both boids have a radius, so the gap closes twice as fast as one moves
    expect(deriveBoidProperties(PROPERTIES).desiredSeparation).toBeCloseTo(
      1.4,
      12,
    );
  });

  it("starts edge avoidance a boid's braking distance out from the wall", () => {
    // v^2 / 2a from full speed under the hardest steer, plus its own reach: any
    // less runway and the boid physically cannot turn before it is through
    expect(deriveBoidProperties(PROPERTIES).edgeMargin).toBeCloseTo(2.7, 12);
  });

  it("keeps the margin ahead of the braking distance at any tuning", () => {
    [
      { maxSpeed: 1, maxForce: 100 },
      { maxSpeed: 40, maxForce: 5 },
      { maxSpeed: 10, maxForce: 24 },
    ].forEach((tuning) => {
      const { edgeMargin, maxSpeed, maxForce } = deriveBoidProperties({
        ...PROPERTIES,
        ...tuning,
      });

      expect(edgeMargin).toBeGreaterThanOrEqual(
        (maxSpeed * maxSpeed) / (2 * maxForce),
      );
    });
  });

  it("passes the rest of the properties through untouched", () => {
    const { fieldOfViewDeg, maxSpeed, maxForce, boidSize } =
      deriveBoidProperties(PROPERTIES);

    expect({ fieldOfViewDeg, maxSpeed, maxForce, boidSize }).toEqual({
      fieldOfViewDeg: PROPERTIES.fieldOfViewDeg,
      maxSpeed: PROPERTIES.maxSpeed,
      maxForce: PROPERTIES.maxForce,
      boidSize: PROPERTIES.boidSize,
    });
  });
});
