import * as THREE from "three";
import { BoidProperties, ForceFactors } from "../behavior/Boid";
import { OCT_TREE_BOUNDARY_SCALE } from "../config";

export const FLOCK_SIZE = 5;
export const FLOCK_COUNT = 5;

const HALF_SIZE = 5;
export const WORLD_BOUNDARY = new THREE.Box3(
  new THREE.Vector3(-HALF_SIZE, -HALF_SIZE, -HALF_SIZE),
  new THREE.Vector3(HALF_SIZE, HALF_SIZE, HALF_SIZE),
);
export const STORAGE_BOUNDARY = WORLD_BOUNDARY.clone().expandByScalar(
  OCT_TREE_BOUNDARY_SCALE,
);
export const BOID_PROPERTIES: BoidProperties = {
  perceptionRadius: 2,
  fieldOfViewDeg: 110,
  desiredSeparation: 1,
  maxSpeed: 5,
  maxForce: 0.3,
  boidSize: 0.1,
};

export const FORCE_FACTORS: ForceFactors = {
  alignmentFactor: 1.01,
  cohesionFactor: 1.02,
  separationFactor: 1.03,
  avoidanceFactor: 1.04,
  seekFactor: 1.05,
  avoidEdgesFactor: 50.01,
};

export interface Seeds {
  x: number[];
  y: number[];
  z: number[];
  phi: number[];
  theta: number[];
}

/** Deterministic per-boid seeds for initialize(). */
export function makeSeeds(count: number): Seeds {
  const seeds: Seeds = { x: [], y: [], z: [], phi: [], theta: [] };

  for (let i = 0; i < count; i++) {
    seeds.x.push(123321 + i * 1234567);
    seeds.y.push(456643 + i * 1234567);
    seeds.z.push(789987 + i * 1234567);
    seeds.phi.push(101110 + i * 1234567);
    seeds.theta.push(131413 + i * 1234567);
  }

  return seeds;
}

const seeds = makeSeeds(FLOCK_SIZE * FLOCK_COUNT);
export const SEED_X = seeds.x;
export const SEED_Y = seeds.y;
export const SEED_Z = seeds.z;
export const SEED_PHI = seeds.phi;
export const SEED_THETA = seeds.theta;

export const SEED_STORAGE_START = 161718;
