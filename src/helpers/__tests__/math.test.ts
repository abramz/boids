import * as THREE from "three";
import { describe, expect, it } from "vitest";
import {
  limit,
  isInFOV,
  getRandomScaledVelocity,
  getRandomRelativePosition,
} from "../math";

const acceptableDiff = 0.00000001; // JS numbers are weird

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

  it("should return true when the target is in the middle of the FOV", () => {
    expect(
      isInFOV(
        new THREE.Vector3(0, 1, 0),
        FORWARD,
        FOV * THREE.MathUtils.DEG2RAD,
      ),
    ).toEqual(true);
  });

  it("should return true when the target is at the edge of the FOV", () => {
    expect(
      isInFOV(
        new THREE.Vector3(1 / Math.sqrt(2), 1 / Math.sqrt(2), 0),
        FORWARD,
        FOV * THREE.MathUtils.DEG2RAD,
      ),
    ).toEqual(true);
  });

  it("should return false when the target is just outside of the FOV", () => {
    expect(
      isInFOV(
        new THREE.Vector3(Math.sqrt(2), 0.9, 0).normalize(), // just outside of 45deg
        FORWARD,
        FOV * THREE.MathUtils.DEG2RAD,
      ),
    ).toEqual(false);
  });

  it("should return false when the target is way outside of the FOV", () => {
    expect(
      isInFOV(
        new THREE.Vector3(0, -1, 0).normalize(),
        FORWARD,
        FOV * THREE.MathUtils.DEG2RAD,
      ),
    ).toEqual(false);
  });
});

describe("getRandomScaledVelocity", () => {
  it("should return a vector with a magnitude equal to maxSpeed", () => {
    const actual = new THREE.Vector3();

    getRandomScaledVelocity(5, actual);
    expect(5 - actual.length()).toBeLessThan(acceptableDiff);

    getRandomScaledVelocity(2, actual);
    expect(2 - actual.length()).toBeLessThan(acceptableDiff);

    getRandomScaledVelocity(10, actual);
    expect(10 - actual.length()).toBeLessThan(acceptableDiff);

    getRandomScaledVelocity(7, actual);
    expect(7 - actual.length()).toBeLessThan(acceptableDiff);
  });
});

describe("getRandomRelativePosition", () => {
  it("should return a vector within the range of the reference position", () => {
    const reference = new THREE.Vector3();
    const actual = new THREE.Vector3();

    getRandomRelativePosition(5, reference, actual);

    expect(Math.abs(actual.x - reference.x)).toBeLessThan(2.5);
    expect(Math.abs(actual.y - reference.y)).toBeLessThan(2.5);
    expect(Math.abs(actual.z - reference.z)).toBeLessThan(2.5);

    reference.set(-30, 5, 72);
    getRandomRelativePosition(10, reference, actual);

    expect(Math.abs(actual.x - reference.x)).toBeLessThan(5);
    expect(Math.abs(actual.y - reference.y)).toBeLessThan(5);
    expect(Math.abs(actual.z - reference.z)).toBeLessThan(5);
  });
});
