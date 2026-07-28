import * as THREE from "three";
import { describe, expect, it } from "vitest";

/**
 * Separates "three changed" from "we changed". A golden fixture can say the
 * output moved but not why; if these still pass while a golden fails, three did
 * not move and the regression is ours.
 *
 * Only primitives the simulation's determinism actually rests on - a pin that
 * cannot move without three shipping a headline breaking change is a
 * maintenance tax on every bump, and the golden would catch it anyway.
 */
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

    expect(new THREE.Vector3().setFromSpherical(spherical).toArray()).toEqual([
      9, 6.000000000000002, -5.196152422706629,
    ]);
  });

  describe("Vector3.angleTo is the field-of-view test in isInFOV", () => {
    // three has re-implemented this for numerical robustness before
    it("orthogonal", () => {
      expect(
        new THREE.Vector3(1, 0, 0).angleTo(new THREE.Vector3(0, 1, 0)),
      ).toBe(1.5707963267948966);
    });

    it("diagonal", () => {
      expect(
        new THREE.Vector3(1, 0, 0).angleTo(
          new THREE.Vector3(1, 1, 1).normalize(),
        ),
      ).toBe(0.9553166181245092);
    });

    it("identical and opposite directions", () => {
      const x = new THREE.Vector3(1, 0, 0);
      expect(x.angleTo(new THREE.Vector3(1, 0, 0))).toBe(0);
      expect(x.angleTo(new THREE.Vector3(-1, 0, 0))).toBe(Math.PI);
    });
  });
});
