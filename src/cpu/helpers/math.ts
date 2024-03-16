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
  const angle = Math.acos(targetDir.dot(forward));

  // comparing to the nearest degree (whole number) so that I don't have to deal with the inconsistency floating point numbers with many significant digits
  return (
    Math.round(angle * THREE.MathUtils.RAD2DEG) <=
    Math.round((fieldOfViewRad / 2) * THREE.MathUtils.RAD2DEG)
  );
}

/**
 * Get a velocity of the specified magnitude in a random direction
 * @param maxSpeed scalar to scale the velocity with
 * @param velocity the output velocity
 * @returns
 */
const tempSpherical = new THREE.Spherical();
export function getRandomScaledVelocity(
  maxSpeed: number,
  /* OUT */ velocity: THREE.Vector3,
): THREE.Vector3 {
  const theta = THREE.MathUtils.randFloat(0, 2 * Math.PI);
  const phi = THREE.MathUtils.randFloat(0, Math.PI);

  tempSpherical.set(maxSpeed, phi, theta);

  return velocity.setFromSpherical(tempSpherical);
}

/**
 * Get a random position within the specified range of a reference position
 * @param range range within which the random position will be
 * @param referencePosition a position to base the random position on
 * @param target the output position
 * @returns the target
 */
export function getRandomRelativePosition(
  range: number,
  referencePosition: THREE.Vector3,
  /* OUT */ target: THREE.Vector3,
): THREE.Vector3 {
  target
    .set(
      THREE.MathUtils.randFloatSpread(range),
      THREE.MathUtils.randFloatSpread(range),
      THREE.MathUtils.randFloatSpread(range),
    )
    .add(referencePosition);

  return target;
}
