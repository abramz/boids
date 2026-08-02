import * as THREE from "three";

export type Random = () => number;

export function limit(vector: THREE.Vector3, max: number): void {
  const sqLength = vector.lengthSq();
  if (sqLength > max * max) {
    vector.divideScalar(Math.sqrt(sqLength)).multiplyScalar(max);
  }
}

export function isInFOV(
  targetDir: THREE.Vector3,
  forward: THREE.Vector3,
  cosHalfFieldOfView: number,
): boolean {
  return targetDir.dot(forward) >= cosHalfFieldOfView;
}

const tempSpherical = new THREE.Spherical();

export function getRandomScaledVelocity(
  maxSpeed: number,
  velocity: THREE.Vector3,
  random: Random,
): THREE.Vector3 {
  const phi = Math.acos(1 - 2 * random());
  const theta = 2 * Math.PI * random();

  tempSpherical.set(maxSpeed, phi, theta);

  return velocity.setFromSpherical(tempSpherical);
}

export function getRandomRelativePosition(
  range: number,
  referencePosition: THREE.Vector3,
  target: THREE.Vector3,
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
