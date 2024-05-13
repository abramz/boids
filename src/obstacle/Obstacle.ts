import * as THREE from "three";
import { Node } from "../storage/OctTree";

export default class Obstacle implements Node {
  public position: THREE.Vector3;
  public radius: number;

  constructor(position: THREE.Vector3, radius: number) {
    this.position = position;
    this.radius = radius;
  }
}
