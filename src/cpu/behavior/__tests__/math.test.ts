import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { limit, isInFOV } from "../math";

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

  it.only("should return false when the target is just outside of the FOV", () => {
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
