import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { seededRandom } from "../../__fixtures__/seededRandom";
import {
  limit,
  isInFOV,
  getRandomScaledVelocity,
  getRandomRelativePosition,
} from "../math";

const ACCEPTABLE_DIFF = 0.00000001; // JS numbers are weird

describe("limit", () => {
  it("should leave the vector untouched if it is below the limit", () => {
    const v = new THREE.Vector3();

    limit(v, 5);

    expect(v.length()).toEqual(0);

    v.set(1, 1, 1).normalize().multiplyScalar(4);

    expect(v.length()).toEqual(4);
  });

  it("should scale the vector to within the limit if it is above the limit", () => {
    const v = new THREE.Vector3(5, 5, 5);

    limit(v, 5);

    expect(v.length()).toEqual(5);
  });
});

describe("isInFOV", () => {
  const FORWARD = new THREE.Vector3(0, 1, 0);
  const FOV = 90;
  const COS_HALF_FOV = Math.cos((FOV * THREE.MathUtils.DEG2RAD) / 2);

  it("should return true when the target is in the middle of the FOV", () => {
    expect(isInFOV(new THREE.Vector3(0, 1, 0), FORWARD, COS_HALF_FOV)).toEqual(
      true,
    );
  });

  it("should return true when the target is just inside the edge of the FOV", () => {
    const justInside = (FOV / 2 - 1) * THREE.MathUtils.DEG2RAD;

    expect(
      isInFOV(
        new THREE.Vector3(Math.sin(justInside), Math.cos(justInside), 0),
        FORWARD,
        COS_HALF_FOV,
      ),
    ).toEqual(true);
  });

  it("should return false when the target is just outside of the FOV", () => {
    const justOutside = (FOV / 2 + 1) * THREE.MathUtils.DEG2RAD;

    expect(
      isInFOV(
        new THREE.Vector3(Math.sin(justOutside), Math.cos(justOutside), 0),
        FORWARD,
        COS_HALF_FOV,
      ),
    ).toEqual(false);
  });

  it("should return false when the target is way outside of the FOV", () => {
    expect(isInFOV(new THREE.Vector3(0, -1, 0), FORWARD, COS_HALF_FOV)).toEqual(
      false,
    );
  });

  it("should see behind itself for a field of view wider than a half turn", () => {
    // the cosine of a half-angle past 90 degrees is negative, which the
    // comparison has to carry rather than special-case
    const wide = Math.cos((230 * THREE.MathUtils.DEG2RAD) / 2);

    expect(isInFOV(new THREE.Vector3(1, 0, 0), FORWARD, wide)).toEqual(true);
    expect(isInFOV(new THREE.Vector3(0, -1, 0), FORWARD, wide)).toEqual(false);
  });
});

describe("getRandomScaledVelocity", () => {
  it("should spread headings evenly over the sphere", () => {
    // Drawing the polar angle flat over [0,pi] crowds headings onto the poles,
    // because a band of constant width covers less sphere the nearer it is to
    // one. Uniform directions have |y|/maxSpeed averaging 1/2 against the 2/pi
    // that flat sampling gives, which is far enough apart to see in a sample
    // this size.
    const random = seededRandom();
    const maxSpeed = 3;
    const velocity = new THREE.Vector3();
    const samples = 20000;

    let total = 0;
    for (let i = 0; i < samples; i++) {
      getRandomScaledVelocity(maxSpeed, velocity, random);
      total += Math.abs(velocity.y) / maxSpeed;
    }

    expect(total / samples).toBeCloseTo(0.5, 2);
  });

  it("should return a vector with a magnitude equal to maxSpeed", () => {
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
  it("should return a vector within the range of the reference position", () => {
    const random = seededRandom();
    const reference = new THREE.Vector3();
    const actual = new THREE.Vector3();

    getRandomRelativePosition(5, reference, actual, random);

    expect(Math.abs(actual.x - reference.x)).toBeLessThan(2.5);
    expect(Math.abs(actual.y - reference.y)).toBeLessThan(2.5);
    expect(Math.abs(actual.z - reference.z)).toBeLessThan(2.5);

    reference.set(-30, 5, 72);
    getRandomRelativePosition(10, reference, actual, random);

    expect(Math.abs(actual.x - reference.x)).toBeLessThan(5);
    expect(Math.abs(actual.y - reference.y)).toBeLessThan(5);
    expect(Math.abs(actual.z - reference.z)).toBeLessThan(5);
  });

  it("should draw the same sequence from the same seed", () => {
    const first = new THREE.Vector3();
    const second = new THREE.Vector3();

    getRandomRelativePosition(5, new THREE.Vector3(), first, seededRandom(42));
    getRandomRelativePosition(5, new THREE.Vector3(), second, seededRandom(42));

    expect(second.toArray()).toEqual(first.toArray());
  });
});
