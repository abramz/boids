import * as THREE from "three";

export default class Obstacle {
  public position: THREE.Vector3;
  public radius: number;

  constructor(position: THREE.Vector3, radius: number) {
    this.position = position;
    this.radius = radius;
  }
}
