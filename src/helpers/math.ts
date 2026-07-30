import * as THREE from "three";

/** A source of uniform numbers in [0,1), so callers can supply a seeded one. */
export type Random = () => number;

/**
 * Limit a vector to within a specified magnitude
 * @param vector the vector
 * @param max the maximum magnitude
 */
export function limit(vector: THREE.Vector3, max: number): void {
  const sqLength = vector.lengthSq();
  if (sqLength > max * max) {
    vector.divideScalar(Math.sqrt(sqLength)).multiplyScalar(max);
  }
}

/**
 * Determine if a direction vector is within the field of view of a point of reference
 * @param targetDir the direction vector, which should be normalized
 * @param forward the forward direction for the point of reference, which should be normalized
 * @param cosHalfFieldOfView cosine of half the field of view. Taken already
 *   cosined so a caller sweeping a neighbourhood works it out once instead of
 *   per neighbour; it goes negative past 180 degrees, which the comparison
 *   handles without a case of its own.
 * @returns true if the target is within the field of view
 */
export function isInFOV(
  targetDir: THREE.Vector3,
  forward: THREE.Vector3,
  cosHalfFieldOfView: number,
): boolean {
  return targetDir.dot(forward) >= cosHalfFieldOfView;
}

const tempSpherical = new THREE.Spherical();

/**
 * Get a velocity of the specified magnitude in a random direction
 * @param maxSpeed scalar to scale the velocity with
 * @param velocity the output velocity
 * @param random the source of randomness
 * @returns the velocity
 */
export function getRandomScaledVelocity(
  maxSpeed: number,
  /* OUT */ velocity: THREE.Vector3,
  random: Random,
): THREE.Vector3 {
  // a polar angle drawn flat over [0,pi] bunches directions around the poles,
  // because a band of constant width covers less sphere the nearer it sits to
  // one; inverting the cosine spreads them evenly over the surface instead
  const phi = Math.acos(1 - 2 * random());
  const theta = 2 * Math.PI * random();

  tempSpherical.set(maxSpeed, phi, theta);

  return velocity.setFromSpherical(tempSpherical);
}

/**
 * Get a random position within the specified range of a reference position
 * @param range range within which the random position will be
 * @param referencePosition a position to base the random position on
 * @param target the output position
 * @param random the source of randomness
 * @returns the target
 */
export function getRandomRelativePosition(
  range: number,
  referencePosition: THREE.Vector3,
  /* OUT */ target: THREE.Vector3,
  random: Random,
): THREE.Vector3 {
  target
    .set(
      (random() - 0.5) * range,
      (random() - 0.5) * range,
      (random() - 0.5) * range,
    )
    .add(referencePosition);

  return target;
}
