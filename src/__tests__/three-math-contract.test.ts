import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { GOLDEN_TOLERANCE } from "../behavior/__tests__/helpers/golden";

/**
 * Separates "three changed" from "we changed". A golden fixture can say the
 * output moved but not why; if these still pass while a golden fails, three did
 * not move and the regression is ours.
 *
 * Only primitives the simulation's determinism actually rests on: a pin that
 * cannot move without three shipping a headline breaking change is a
 * maintenance tax on every bump, and the golden would catch it anyway.
 *
 * Anything built out of comparisons and integer arithmetic is pinned exactly,
 * every engine reproducing it bit for bit. Anything that goes through
 * Math.sin/cos/acos, which ECMAScript does not require to be correctly rounded,
 * is held to the tolerance the goldens use instead: tight enough to catch three
 * changing what it computes, loose enough to survive a different CPU computing
 * it. Pinning those exactly would invert the rule this file exists for, failing
 * here and passing there on nothing worse than a machine change.
 */

/** Digits of agreement standing in for GOLDEN_TOLERANCE. */
const GOLDEN_DIGITS = -Math.log10(GOLDEN_TOLERANCE);

describe("three.js math contract", () => {
  describe("MathUtils.seededRandom drives every initial position and velocity", () => {
    it.each([
      [123321, 0.4422199653927237],
      [456643, 0.3556910762563348],
      [789987, 0.6560491761192679],
      [101110, 0.8915609940886497],
      [131413, 0.8978849095292389],
    ])("seededRandom(%i)", (seed, expected) => {
      expect(THREE.MathUtils.seededRandom(seed)).toBe(expected);
    });

    it("is a stateful generator - unseeded calls continue the sequence", () => {
      THREE.MathUtils.seededRandom(123321);
      expect([
        THREE.MathUtils.seededRandom(),
        THREE.MathUtils.seededRandom(),
        THREE.MathUtils.seededRandom(),
      ]).toEqual([0.6624998771585524, 0.6098637070972472, 0.9039580919779837]);
    });
  });

  it("Vector3.setFromSpherical builds every initial velocity", () => {
    const spherical = new THREE.Spherical().set(
      12,
      1.0471975511965976,
      2.0943951023931953,
    );

    const built = new THREE.Vector3().setFromSpherical(spherical).toArray();

    [9, 6, (-6 * Math.sqrt(3)) / 2].forEach((expected, axis) => {
      expect(built[axis]).toBeCloseTo(expected, GOLDEN_DIGITS);
    });
  });

  describe("Box3 and Sphere decide what a boid sees and where it is held", () => {
    /* pinned exactly: these are comparisons of sums and products, with no
       transcendental to round differently from one machine to the next */

    it("Sphere.containsPoint takes a point exactly on the surface", () => {
      // every neighbour the index hands back is one this admitted, so a
      // stricter comparison here silently narrows the perception radius
      const sphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 2);

      expect(sphere.containsPoint(new THREE.Vector3(2, 0, 0))).toBe(true);
      expect(sphere.containsPoint(new THREE.Vector3(2.0000001, 0, 0))).toBe(
        false,
      );
    });

    it("Box3.distanceToPoint is zero inside and unsigned outside", () => {
      /* drawToCenter is switched on by this being non-zero, so a signed
         distance would have it pulling on the whole flock all the time rather
         than only on what has strayed */
      const box = new THREE.Box3(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(1, 1, 1),
      );

      expect(box.distanceToPoint(new THREE.Vector3(0.5, 0.5, 0.5))).toBe(0);
      expect(box.distanceToPoint(new THREE.Vector3(1, 0.5, 0.5))).toBe(0);
      expect(box.distanceToPoint(new THREE.Vector3(4, 0.5, 0.5))).toBe(3);
      expect(box.distanceToPoint(new THREE.Vector3(-3, 0.5, 0.5))).toBe(3);
    });
  });
});
