import * as THREE from "three";
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

const LATTICE = [-1, 1];

export interface CreateSimulationOptions {
  flockSize: number;
  flockCount: number;
  worldSize: number;
  maxSpeed: number;
  random?: Random;
  gridCellSize?: number;
  gridBucketsPerBoid?: number;
  obstacleOffset?: number;
  obstacleRadiusScale?: number;
  maxDelta?: number;
}

export interface StepOptions {
  delta: number;
  properties: BoidProperties;
  forceFactors: ForceFactors;
}

export interface Simulation {
  readonly grid: HashGrid<Boid>;
  readonly boids: readonly Boid[];
  readonly obstacles: readonly Obstacle[];
  readonly worldBoundary: THREE.Box3;
  occupiedCells(): THREE.Box3[];
  step(options: StepOptions): void;
}

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

  const grid = new HashGrid<Boid>({
    cellSize: gridCellSize,
    tableSize: flockSize * flockCount * gridBucketsPerBoid,
  });
  const boids: Boid[] = [];
  const obstacles: Obstacle[] = [];

  let id = 0;
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

      boids.push(new Boid({ id: id++, parentId: flock, position, velocity }));
    }
  }

  grid.build(boids);

  const radius = worldSize * obstacleRadiusScale;
  const offset = (worldSize * obstacleOffset) / 2;
  for (const x of LATTICE) {
    for (const y of LATTICE) {
      for (const z of LATTICE) {
        obstacles.push(
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
    grid,
    boids,
    obstacles,
    worldBoundary,
    occupiedCells: () => grid.occupiedCells(),
    step({ delta, properties, forceFactors }: StepOptions): void {
      frameSign = stepSimulation({
        grid,
        boids,
        obstacles,
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
