import * as THREE from "three";
import { expect, it } from "vitest";
import { GOLDEN_TOLERANCE } from "../behavior/__tests__/helpers/golden";

/**
 * Separates "three changed" from "we changed". A golden fixture can say the
 * output moved but not why; if these still pass while a golden fails, three did
 * not move and the regression is ours.
 *
 * Only the two primitives the flock is seeded through, because they are the
 * ones whose movement the golden cannot describe: every initial position and
 * heading comes through them, so when either shifts the whole fixture shifts at
 * once and no other suite has anything to say about it. What three computes
 * from those positions afterwards is pinned where the simulation uses it, and
 * fails there under its own name.
 */

/** Digits of agreement standing in for GOLDEN_TOLERANCE. */
const GOLDEN_DIGITS = -Math.log10(GOLDEN_TOLERANCE);
it("MathUtils.seededRandom draws the sequence the fixtures were recorded on", () => {
  /* stateful, and seeded once per fixture: what has to hold is the sequence,
     not just the first number of it */
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
  /* held to the goldens' own tolerance rather than exactly: this goes through
     Math.sin/cos, which ECMAScript does not require to be correctly rounded, so
     an exact pin would fail on a CPU other than the one that recorded */
  const built = new THREE.Vector3()
    .setFromSpherical(
      new THREE.Spherical().set(12, 1.0471975511965976, 2.0943951023931953),
    )
    .toArray();

  [9, 6, (-6 * Math.sqrt(3)) / 2].forEach((expected, axis) =>
    expect(built[axis]).toBeCloseTo(expected, GOLDEN_DIGITS),
  );
});
