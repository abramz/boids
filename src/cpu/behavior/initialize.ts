import * as THREE from "three";
import BoidStore from "../storage/BoidStore";
import {
  getRandomRelativePosition,
  getRandomScaledVelocity,
} from "../helpers/math";
import OctTree from "../storage/OctTree";
import { OCT_TREE_CAPACITY } from "../config";
import determineFlockSize from "../helpers/determineFlockSize";
import Boid from "./Boid";

const DEFAULT_POSITION = new THREE.Vector3(0, 0, 0);
const tempWorldSize = new THREE.Vector3();

/**
 * Initialize the simulation
 * 1. determine the ideal flock size based on system performance
 * 2. initialize the boids & adds them to storage
 * @param maybeFlockSize the number of boids that we would like to be in each flock
 * @param numFlocks the number of flocks
 * @param maxSpeed the maximum magnitude of the boid's speed
 * @param storageBoundary the world's bounding box
 * @param worldBoundary the world's bounding box
 * @param seed* optional seeds for testing
 */
export default async function initialize(
  maybeFlockSize: number,
  numFlocks: number,
  maxSpeed: number,
  worldBoundary: THREE.Box3,
  storageBoundary: THREE.Box3,
  seedX?: number[],
  seedY?: number[],
  seedZ?: number[],
  seedPhi?: number[],
  seedTheta?: number[],
  seedStorageStart?: number,
): Promise<BoidStore> {
  const flockSize = await determineFlockSize(maybeFlockSize);

  const storage = new BoidStore(
    new OctTree<Boid>(storageBoundary, OCT_TREE_CAPACITY, seedStorageStart),
  );
  worldBoundary.getSize(tempWorldSize);

  let idx = 0;
  for (let i = 0; i < numFlocks; i++) {
    for (let j = 0; j < flockSize; j++) {
      const position = new THREE.Vector3();
      getRandomRelativePosition(
        tempWorldSize.x, // world is a cube
        DEFAULT_POSITION,
        position,
        (seedX ?? [])[idx],
        (seedY ?? [])[idx],
        (seedZ ?? [])[idx],
      );

      const velocity = new THREE.Vector3();
      getRandomScaledVelocity(
        maxSpeed,
        velocity,
        (seedPhi ?? [])[idx],
        (seedTheta ?? [])[idx],
      );

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

  return storage;
}
