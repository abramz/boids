import * as THREE from "three";

export default class BoidGeometry extends THREE.BoxGeometry {
  constructor(size: number) {
    super(size, size, size);
  }
}
