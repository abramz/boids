import * as THREE from "three";

export default class BoidMaterial extends THREE.MeshStandardMaterial {
  constructor() {
    super({
      vertexColors: true,
      toneMapped: false,
    });
  }
}
