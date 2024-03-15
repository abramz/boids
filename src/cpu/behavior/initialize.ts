import * as THREE from "three";
import BoidStore from "../storage/BoidStore";
import Boid from "./Boid";
import { getRandomRelativePosition, getRandomScaledVelocity } from "./math";

const DEFAULT_POSITION = new THREE.Vector3(0, 0, 0);
const tempWorldSize = new THREE.Vector3();

export default function initialize(
  numBoidsPerFlock: number,
  numFlocks: number,
  maxSpeed: number,
  worldBoundary: THREE.Box3,
  storage: BoidStore,
): void {
  worldBoundary.getSize(tempWorldSize);

  let idx = 0;
  for (let i = 0; i < numFlocks; i++) {
    for (let j = 0; j < numBoidsPerFlock; j++) {
      const position = new THREE.Vector3();
      getRandomRelativePosition(
        Math.max(tempWorldSize.x, tempWorldSize.z),
        tempWorldSize.y,
        DEFAULT_POSITION,
        position,
      );

      const velocity = new THREE.Vector3();
      getRandomScaledVelocity(maxSpeed, velocity);

      storage.insert(
        new Boid({
          id: idx++,
          parentId: i,
          position,
          velocity,
        }),
      );
    }
  }
}
