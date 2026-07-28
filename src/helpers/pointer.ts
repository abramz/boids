import * as THREE from "three";

/* this is all single threaded so calls can share a temp variable */
const raycaster = new THREE.Raycaster();

/**
 * Convert a pointer's viewport position to normalized device coordinates.
 *
 * NDC runs -1..1 with +y up, client coordinates run 0..size with +y down,
 * hence the flip on y.
 */
export function toNormalizedDeviceCoordinates(
  clientX: number,
  clientY: number,
  width: number,
  height: number,
  /* OUT */ outVector: THREE.Vector2,
): THREE.Vector2 {
  outVector.x = (clientX / width) * 2 - 1;
  outVector.y = -(clientY / height) * 2 + 1;

  return outVector;
}

/**
 * Project a pointer position into the world.
 *
 * A pointer names a ray rather than a point, so `distance` picks how far along
 * that ray the target sits.
 */
export function projectPointerToWorld(
  ndc: THREE.Vector2,
  camera: THREE.Camera,
  distance: number,
  /* OUT */ outVector: THREE.Vector3,
): THREE.Vector3 {
  raycaster.setFromCamera(ndc, camera);

  return outVector
    .copy(raycaster.ray.direction)
    .multiplyScalar(distance)
    .add(raycaster.ray.origin);
}
