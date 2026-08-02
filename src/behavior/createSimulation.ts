import * as THREE from "three";
import BoidStore from "../storage/BoidStore";
import HashGrid from "../storage/HashGrid";
import Obstacle from "../obstacle/Obstacle";
import {
  Random,
  getRandomRelativePosition,
  getRandomScaledVelocity,
} from "../helpers/math";
import * as config from "../config";
import Boid, { BoidProperties, ForceFactors } from "./Boid";
import deriveBoidProperties from "./deriveBoidProperties";
import stepSimulation from "./step";

const ORIGIN = new THREE.Vector3(0, 0, 0);

/* the two sides of each axis the obstacle lattice is built from */
const LATTICE = [-1, 1];

export interface CreateSimulationOptions {
  /** boids in each flock */
  flockSize: number;
  flockCount: number;
  /** length of the world cube's side */
  worldSize: number;
  /** the speed boids set off at */
  maxSpeed: number;
  /**
   * Where the initial positions and headings come from. Left out it is
   * `Math.random`; a fixture passes a seeded one to get a flock it can pin.
   */
  random?: Random;
  /**
   * The shape of the world, defaulted from config. A fixture overrides these to
   * pin the world its goldens were recorded against, so retuning the production
   * numbers moves the flock rather than the fixtures.
   */
  gridCellSize?: number;
  gridBucketsPerBoid?: number;
  obstacleOffset?: number;
  obstacleRadiusScale?: number;
  maxDelta?: number;
}

export interface StepOptions {
  /** seconds elapsed since the previous frame */
  delta: number;
  properties: BoidProperties;
  forceFactors: ForceFactors;
}

/**
 * A built world and the state of running it. Everything a frame needs beyond
 * the clock and the current tuning lives in here, and a caller drives it with a
 * delta.
 */
export interface Simulation {
  /**
   * The flock and the index over it. Exposed for the callers that drive the
   * store itself - `step.ts` and the benchmark, which time a rebuild and a
   * query apart from a frame. A renderer wants the projections below.
   */
  readonly storage: BoidStore;
  readonly boids: readonly Boid[];
  readonly obstacles: readonly Obstacle[];
  /**
   * The cube edge avoidance turns boids at, and that the draw to center takes
   * its centre and its length scale from. With edge avoidance shipped off, the
   * flock settles outside it rather than within it.
   */
  readonly worldBoundary: THREE.Box3;
  /** The occupied cells of the index, as they stand. For the debug overlay. */
  cellBoundaries(): THREE.Box3[];
  step(options: StepOptions): void;
}

/**
 * Build the flock, the obstacles it flies around, and the index over the flock.
 *
 * The index covers unbounded space, so the world here is only what the boids
 * steer to stay inside; it is not a wall, and nothing goes wrong for the index
 * when a boid overshoots it.
 */
export default function createSimulation({
  flockSize,
  flockCount,
  worldSize,
  maxSpeed,
  random = Math.random,
  gridCellSize = config.GRID_CELL_SIZE,
  gridBucketsPerBoid = config.GRID_BUCKETS_PER_BOID,
  obstacleOffset = config.OBSTACLE_OFFSET,
  obstacleRadiusScale = config.OBSTACLE_RADIUS_SCALE,
  maxDelta = config.MAX_DELTA,
}: CreateSimulationOptions): Simulation {
  const halfSize = worldSize / 2;
  const worldBoundary = new THREE.Box3(
    new THREE.Vector3(-halfSize, -halfSize, -halfSize),
    new THREE.Vector3(halfSize, halfSize, halfSize),
  );

  const storage = new BoidStore(
    new HashGrid<Boid>({
      cellSize: gridCellSize,
      tableSize: flockSize * flockCount * gridBucketsPerBoid,
    }),
  );

  let idx = 0;
  for (let flock = 0; flock < flockCount; flock++) {
    for (let member = 0; member < flockSize; member++) {
      const position = getRandomRelativePosition(
        worldSize,
        ORIGIN,
        new THREE.Vector3(),
        random,
      );
      const velocity = getRandomScaledVelocity(
        maxSpeed,
        new THREE.Vector3(),
        random,
      );

      storage.insert(
        new Boid({ id: idx++, parentId: flock, position, velocity }),
      );
    }
  }

  /* the index is built in one pass over the whole flock, so nothing inserted
     above is visible to a query until this runs */
  storage.reindex();

  const radius = worldSize * obstacleRadiusScale;
  const offset = (worldSize * obstacleOffset) / 2;
  for (const x of LATTICE) {
    for (const y of LATTICE) {
      for (const z of LATTICE) {
        storage.insertObstacle(
          new Obstacle(
            new THREE.Vector3(offset * x, offset * y, offset * z),
            radius,
          ),
        );
      }
    }
  }

  let frameSign = 1;

  return {
    storage,
    boids: storage.boids,
    obstacles: storage.obstacles,
    worldBoundary,
    cellBoundaries: () => storage.cellBoundaries(),
    step({ delta, properties, forceFactors }: StepOptions): void {
      frameSign = stepSimulation({
        storage,
        boids: storage.boids,
        frameSign,
        delta,
        maxDelta,
        properties: deriveBoidProperties(properties),
        forceFactors,
        worldBoundary,
      });
    },
  };
}
