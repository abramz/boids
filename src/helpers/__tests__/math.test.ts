import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { seededRandom } from "../../__fixtures__/seededRandom";
import {
  limit,
  isInFOV,
  getRandomScaledVelocity,
  getRandomRelativePosition,
} from "../math";

const ACCEPTABLE_DIFF = 0.00000001;

describe("limit", () => {
  it("leaves the vector untouched if it is below the limit", () => {
    const v = new THREE.Vector3(1, 1, 1).normalize().multiplyScalar(4);
    const before = v.toArray();

    limit(v, 5);

    expect(v.toArray()).toEqual(before);
  });

  it("scales the vector to within the limit if it is above the limit", () => {
    const v = new THREE.Vector3(5, 5, 5);
    const heading = v.clone().normalize();

    limit(v, 5);

    expect(v.length()).toEqual(5);
    expect(v.clone().normalize().toArray()).toEqual(heading.toArray());
  });
});

describe("isInFOV", () => {
  const FORWARD = new THREE.Vector3(0, 1, 0);
  const FOV = 90;
  const COS_HALF_FOV = Math.cos((FOV * THREE.MathUtils.DEG2RAD) / 2);

  it("returns true when the target is just inside the edge of the FOV", () => {
    const justInside = (FOV / 2 - 1) * THREE.MathUtils.DEG2RAD;

    expect(
      isInFOV(
        new THREE.Vector3(Math.sin(justInside), Math.cos(justInside), 0),
        FORWARD,
        COS_HALF_FOV,
      ),
    ).toEqual(true);
  });

  it("returns false when the target is just outside of the FOV", () => {
    const justOutside = (FOV / 2 + 1) * THREE.MathUtils.DEG2RAD;

    expect(
      isInFOV(
        new THREE.Vector3(Math.sin(justOutside), Math.cos(justOutside), 0),
        FORWARD,
        COS_HALF_FOV,
      ),
    ).toEqual(false);
  });

  it("sees behind itself for a field of view wider than a half turn", () => {
    const wide = Math.cos((230 * THREE.MathUtils.DEG2RAD) / 2);

    expect(isInFOV(new THREE.Vector3(1, 0, 0), FORWARD, wide)).toEqual(true);
    expect(isInFOV(new THREE.Vector3(0, -1, 0), FORWARD, wide)).toEqual(false);
  });
});

describe("getRandomScaledVelocity", () => {
  it("spreads headings evenly over the sphere", () => {
    const random = seededRandom();
    const maxSpeed = 3;
    const velocity = new THREE.Vector3();
    const samples = 20000;

    let total = 0;
    for (let i = 0; i < samples; i++) {
      getRandomScaledVelocity(maxSpeed, velocity, random);
      total += Math.abs(velocity.y) / maxSpeed;
    }

    expect(Math.abs(total / samples - 0.5)).toBeLessThan(0.02);
  });

  it("returns a vector with a magnitude equal to maxSpeed", () => {
    const random = seededRandom();
    const actual = new THREE.Vector3();

    [5, 2, 10, 7].forEach((maxSpeed) => {
      getRandomScaledVelocity(maxSpeed, actual, random);

      expect(Math.abs(maxSpeed - actual.length())).toBeLessThan(
        ACCEPTABLE_DIFF,
      );
    });
  });
});

describe("getRandomRelativePosition", () => {
  it("scatters through the range around the reference position", () => {
    const random = seededRandom();
    const reference = new THREE.Vector3(-30, 5, 72);
    const actual = new THREE.Vector3();
    const range = 10;

    const offsets = Array.from({ length: 500 }, () => {
      getRandomRelativePosition(range, reference, actual, random);

      return actual.clone().sub(reference);
    });

    offsets.forEach((offset) =>
      (["x", "y", "z"] as const).forEach((axis) =>
        expect(Math.abs(offset[axis])).toBeLessThanOrEqual(range / 2),
      ),
    );

    (["x", "y", "z"] as const).forEach((axis) => {
      const spread = offsets.map((offset) => offset[axis]);

      expect(Math.max(...spread)).toBeGreaterThan(range / 4);
      expect(Math.min(...spread)).toBeLessThan(-range / 4);
    });
  });
});
