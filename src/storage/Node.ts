import * as THREE from "three";

/**
 * All a spatial index needs of what it holds: somewhere to sort it by.
 *
 * Its own module rather than the index's, so what is indexed depends on the
 * contract and not on which index happens to be behind it.
 */
export interface Node {
  position: THREE.Vector3;
}
