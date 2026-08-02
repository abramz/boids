import { describe, expect, it } from "vitest";
import { BoidProperties } from "../Boid";
import deriveBoidProperties from "../deriveBoidProperties";

const PROPERTIES: BoidProperties = {
  perceptionRadius: 3,
  fieldOfViewDeg: 230,
  desiredSeparation: 1,
  neighborLimit: 8,
  minSpeed: 5,
  maxSpeed: 10,
  maxForce: 20,
  boidSize: 0.2,
};

describe("deriveBoidProperties", () => {
  it("widens perception by a boid's own reach", () => {
    expect(deriveBoidProperties(PROPERTIES).perceptionRadius).toBeCloseTo(
      3.2,
      12,
    );
  });

  it("measures separation surface to surface", () => {
    expect(deriveBoidProperties(PROPERTIES).desiredSeparation).toBeCloseTo(
      1.4,
      12,
    );
  });

  it("starts edge avoidance a boid's braking distance out from the wall", () => {
    expect(deriveBoidProperties(PROPERTIES).edgeMargin).toBeCloseTo(2.7, 12);

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

  it("cosines the field of view once rather than per boid that re-aims", () => {
    expect(deriveBoidProperties(PROPERTIES).cosHalfFieldOfView).toBeCloseTo(
      Math.cos((230 * Math.PI) / 180 / 2),
      12,
    );
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
