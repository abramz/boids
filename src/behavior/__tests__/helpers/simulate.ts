import * as THREE from "three";
import { makeSeeds } from "../../../__fixtures__/seededConfig";
import BoidStore from "../../../storage/BoidStore";
import Boid, { BoidProperties, ForceFactors } from "../../Boid";
import deriveBoidProperties from "../../deriveBoidProperties";
import initialize from "../../initialize";
import stepSimulation from "../../step";

/**
 * Runs the real simulation, headlessly and deterministically.
 *
 * `initialize` is called directly rather than through `src/helpers/suspend.ts`,
 * which caches its result in a module-level singleton and would hand every
 * caller the same already-advanced store.
 */

export const DELTA = 1 / 60;

export interface SimulationConfig {
  flockSize: number;
  flockCount: number;
  halfWorldSize: number;
  properties: BoidProperties;
  forceFactors: ForceFactors;
}

/**
 * A denser world than src/__fixtures__/seededConfig.ts.
 *
 * Emergent flocking is a statistical effect: at 25 boids in a 10-unit cube a
 * boid's perception sphere is mostly empty, so alignment and cohesion barely
 * register above the edge-avoidance force. This packs enough boids together for
 * the flocking behaviours to actually be measurable.
 */
export const DENSE_CONFIG: SimulationConfig = {
  flockSize: 24,
  flockCount: 4,
  halfWorldSize: 5,
  properties: {
    perceptionRadius: 2.5,
    fieldOfViewDeg: 230,
    desiredSeparation: 0.8,
    maxSpeed: 4,
    maxForce: 0.4,
    boidSize: 0.1,
  },
  forceFactors: {
    alignmentFactor: 1,
    cohesionFactor: 1,
    separationFactor: 1,
    // the shipped value is 50, which swamps every other force and makes
    // flocking effects unmeasurable; keep edges gentle so the flocking
    // behaviours are what the assertions actually see
    avoidEdgesFactor: 1,
  },
};

export interface RunOptions {
  config?: SimulationConfig;
  steps?: number;
  /** overrides merged over the config's force factors */
  forceFactors?: Partial<ForceFactors>;
  /** overrides merged over the config's boid properties */
  properties?: Partial<BoidProperties>;
  /** seconds per step; defaults to a 60fps frame */
  delta?: number;
  /**
   * Storage boundary margin as a multiple of the world half-size. The default
   * matches production (OCT_TREE_BOUNDARY_SCALE against WORLD_SIZE); raise it
   * only for tests that need boids to wander without hitting the tree edge.
   */
  storageMargin?: number;
  /** called after every step, before the next one */
  onStep?: (boids: Boid[], step: number) => void;
}

export interface RunResult {
  storage: BoidStore;
  boids: Boid[];
  /** flat [x,y,z] per boid, in stable order — the trajectory fingerprint */
  positions: number[];
  velocities: number[];
}

export async function runSimulation({
  config = DENSE_CONFIG,
  steps = 120,
  forceFactors = {},
  properties = {},
  delta = DELTA,
  storageMargin = 0.6,
  onStep,
}: RunOptions = {}): Promise<RunResult> {
  const boidProperties = { ...config.properties, ...properties };
  const factors = { ...config.forceFactors, ...forceFactors };
  const half = config.halfWorldSize;

  const worldBoundary = new THREE.Box3(
    new THREE.Vector3(-half, -half, -half),
    new THREE.Vector3(half, half, half),
  );
  const storageBoundary = worldBoundary
    .clone()
    .expandByScalar(half * storageMargin);

  const seeds = makeSeeds(config.flockSize * config.flockCount);
  const storage = await initialize(
    config.flockSize,
    config.flockCount,
    boidProperties.maxSpeed,
    worldBoundary,
    storageBoundary,
    seeds.x,
    seeds.y,
    seeds.z,
    seeds.phi,
    seeds.theta,
    161718,
  );

  const boids = storage.boids;
  const derived = deriveBoidProperties(boidProperties);

  let frameSign = 1;
  for (let step = 0; step < steps; step++) {
    frameSign = stepSimulation({
      storage,
      boids,
      frameSign,
      delta,
      properties: derived,
      forceFactors: factors,
      worldBoundary,
    });
    onStep?.(boids, step);
  }

  return {
    storage,
    boids,
    positions: boids.flatMap((boid) => boid.position.toArray()),
    velocities: boids.flatMap((boid) => boid.velocity.toArray()),
  };
}

/** Largest absolute difference between two equal-length trajectory fingerprints. */
export function maxAbsDifference(a: number[], b: number[]): number {
  expectSameLength(a, b);

  return a.reduce(
    (worst, value, index) => Math.max(worst, Math.abs(value - b[index])),
    0,
  );
}

function expectSameLength(a: number[], b: number[]): void {
  if (a.length !== b.length) {
    throw new Error(`length mismatch: ${a.length} vs ${b.length}`);
  }
}

/** Mean cosine similarity of headings within each flock, averaged over flocks. */
export function meanHeadingAgreement(boids: Boid[]): number {
  const flocks = new Map<number, Boid[]>();
  boids.forEach((boid) => {
    const flock = flocks.get(boid.parentId) ?? [];
    flock.push(boid);
    flocks.set(boid.parentId, flock);
  });

  const perFlock = [...flocks.values()].map((flock) => {
    let total = 0;
    let pairs = 0;

    for (let i = 0; i < flock.length; i++) {
      for (let j = i + 1; j < flock.length; j++) {
        const a = flock[i].velocity;
        const b = flock[j].velocity;
        const lengths = a.length() * b.length();
        if (lengths > 0) {
          total += a.dot(b) / lengths;
          pairs++;
        }
      }
    }

    return pairs > 0 ? total / pairs : 0;
  });

  return perFlock.reduce((sum, value) => sum + value, 0) / perFlock.length;
}

/** Mean distance between boids of the same flock, averaged over flocks. */
export function meanIntraFlockDistance(boids: Boid[]): number {
  const flocks = new Map<number, Boid[]>();
  boids.forEach((boid) => {
    const flock = flocks.get(boid.parentId) ?? [];
    flock.push(boid);
    flocks.set(boid.parentId, flock);
  });

  const perFlock = [...flocks.values()].map((flock) => {
    let total = 0;
    let pairs = 0;

    for (let i = 0; i < flock.length; i++) {
      for (let j = i + 1; j < flock.length; j++) {
        total += flock[i].position.distanceTo(flock[j].position);
        pairs++;
      }
    }

    return pairs > 0 ? total / pairs : 0;
  });

  return perFlock.reduce((sum, value) => sum + value, 0) / perFlock.length;
}

/** Mean of the per-boid distance to that boid's nearest neighbour. */
export function meanNearestNeighbourDistance(boids: Boid[]): number {
  const distances = boids.map((boid) => {
    let nearest = Infinity;
    boids.forEach((other) => {
      if (other !== boid) {
        nearest = Math.min(nearest, boid.position.distanceTo(other.position));
      }
    });

    return nearest;
  });

  return distances.reduce((sum, value) => sum + value, 0) / distances.length;
}
