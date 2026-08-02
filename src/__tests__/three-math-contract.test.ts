import * as THREE from "three";
import { expect, it } from "vitest";
import { GOLDEN_TOLERANCE } from "../behavior/__tests__/helpers/golden";

const GOLDEN_DIGITS = -Math.log10(GOLDEN_TOLERANCE);
it("MathUtils.seededRandom draws the sequence the fixtures were recorded on", () => {
  expect([
    THREE.MathUtils.seededRandom(123321),
    THREE.MathUtils.seededRandom(),
    THREE.MathUtils.seededRandom(),
    THREE.MathUtils.seededRandom(),
  ]).toEqual([
    0.4422199653927237, 0.6624998771585524, 0.6098637070972472,
    0.9039580919779837,
  ]);
});

it("Vector3.setFromSpherical turns the drawn angles into the same heading", () => {
  const built = new THREE.Vector3()
    .setFromSpherical(
      new THREE.Spherical().set(12, 1.0471975511965976, 2.0943951023931953),
    )
    .toArray();

  [9, 6, (-6 * Math.sqrt(3)) / 2].forEach((expected, axis) =>
    expect(built[axis]).toBeCloseTo(expected, GOLDEN_DIGITS),
  );
});
