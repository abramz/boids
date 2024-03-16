import * as THREE from "three";
import BoidStore from "../storage/BoidStore";
import {
  getRandomRelativePosition,
  getRandomScaledVelocity,
} from "../helpers/math";
import Boid from "./Boid";

const DEFAULT_POSITION = new THREE.Vector3(0, 0, 0);
const tempWorldSize = new THREE.Vector3();

/**
 * Initialize the simulation
 * @param numBoidsPerFlock the number of boids that will be in each flock
 * @param numFlocks the number of flocks
 * @param maxSpeed the maximum magnitude of the boid's speed
 * @param worldBoundary the world's bounding box
 * @param storage the boid store for the simulation
 */
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
        tempWorldSize.x, // world is a cube
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
