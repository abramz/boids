import * as THREE from "three";

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
 * @param fieldOfViewRad the angle, in radians, of the field of view
 * @returns true if the target is within the field of view
 */
export function isInFOV(
  targetDir: THREE.Vector3,
  forward: THREE.Vector3,
  fieldOfViewRad: number,
): boolean {
  return forward.angleTo(targetDir) <= fieldOfViewRad / 2;
}

/**
 * Get a velocity of the specified magnitude in a random direction
 * @param maxSpeed scalar to scale the velocity with
 * @param velocity the output velocity
 * @param seedPhi an optional seed for Phi to make testing easier
 * @param seedTheta an optional seed for Theta to make testing easier
 * @returns the velocity
 */
const tempSpherical = new THREE.Spherical();
export function getRandomScaledVelocity(
  maxSpeed: number,
  /* OUT */ velocity: THREE.Vector3,
  seedPhi?: number,
  seedTheta?: number,
): THREE.Vector3 {
  const phi = seededRandom(0, Math.PI, seedPhi);
  const theta = seededRandom(0, 2 * Math.PI, seedTheta);

  tempSpherical.set(maxSpeed, phi, theta);

  return velocity.setFromSpherical(tempSpherical);
}

/**
 * Get a random position within the specified range of a reference position
 * @param range range within which the random position will be
 * @param referencePosition a position to base the random position on
 * @param target the output position
 * @param seedX an optional seed for X to make testing easier
 * @param seedY an optional seed for Y to make testing easier
 * @param seedZ an optional seed for Z to make testing easier
 * @returns the target
 */
export function getRandomRelativePosition(
  range: number,
  referencePosition: THREE.Vector3,
  /* OUT */ target: THREE.Vector3,
  seedX?: number,
  seedY?: number,
  seedZ?: number,
): THREE.Vector3 {
  const min = -range / 2;
  const max = range / 2;
  target
    .set(
      seededRandom(min, max, seedX),
      seededRandom(min, max, seedY),
      seededRandom(min, max, seedZ),
    )
    .add(referencePosition);

  return target;
}

/**
 * Map a seeded random number to a range [min,max]
 * @param min inclusive minimum for the random number
 * @param max inclsuvie maximum for the random number
 * @param seed an optional seed
 */
export function seededRandom(min: number, max: number, seed?: number): number {
  return THREE.MathUtils.mapLinear(
    seed ? THREE.MathUtils.seededRandom(seed) : THREE.MathUtils.randFloat(0, 1),
    0,
    1,
    min,
    max,
  );
}
