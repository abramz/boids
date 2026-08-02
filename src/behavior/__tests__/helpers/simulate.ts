import { PinnedWorld, pinnedWorld } from "../../../__fixtures__/pinnedWorld";
import { seededRandom } from "../../../__fixtures__/seededRandom";
import Boid, { BoidProperties, ForceFactors } from "../../Boid";
import createSimulation, { Simulation } from "../../createSimulation";

export const FRAME_DELTA = 1 / 60;

export interface SimulationConfig {
  flockSize: number;
  flockCount: number;
  worldSize: number;
  properties: BoidProperties;
  forceFactors: ForceFactors;
  world: PinnedWorld;
}

const FLOCKING_PROPERTIES: BoidProperties = {
  perceptionRadius: 2.5,
  fieldOfViewDeg: 230,
  desiredSeparation: 0.8,
  neighborLimit: 8,
  minSpeed: 2,
  maxSpeed: 4,
  maxForce: 12,
  boidSize: 0.1,
};

export const FLOCKING_CONFIG: SimulationConfig = {
  flockSize: 24,
  flockCount: 4,
  worldSize: 10,
  properties: FLOCKING_PROPERTIES,
  forceFactors: {
    alignmentFactor: 1,
    cohesionFactor: 1,
    separationFactor: 1,
    avoidEdgesFactor: 1,
    avoidObstaclesFactor: 1,
    drawToCenterFactor: 1,
  },
  world: pinnedWorld(FLOCKING_PROPERTIES),
};

export interface RunOptions {
  config?: SimulationConfig;
  steps?: number;
  forceFactors?: Partial<ForceFactors>;
  properties?: Partial<BoidProperties>;
  delta?: number;
  onStep?: (simulation: Simulation, step: number) => void;
}

export interface RunResult {
  simulation: Simulation;
  boids: readonly Boid[];
  positions: number[];
  velocities: number[];
}

export function runSimulation({
  config = FLOCKING_CONFIG,
  steps = 120,
  forceFactors = {},
  properties = {},
  delta = FRAME_DELTA,
  onStep,
}: RunOptions = {}): RunResult {
  const boidProperties = { ...config.properties, ...properties };
  const factors = { ...config.forceFactors, ...forceFactors };

  const simulation = createSimulation({
    ...config.world,
    flockSize: config.flockSize,
    flockCount: config.flockCount,
    worldSize: config.worldSize,
    maxSpeed: boidProperties.maxSpeed,
    random: seededRandom(),
  });

  const { boids } = simulation;
  for (let step = 0; step < steps; step++) {
    simulation.step({
      delta,
      properties: boidProperties,
      forceFactors: factors,
    });
    onStep?.(simulation, step);
  }

  return {
    simulation,
    boids,
    positions: boids.flatMap((boid) => boid.position.toArray()),
    velocities: boids.flatMap((boid) => boid.velocity.toArray()),
  };
}

function byFlock(boids: readonly Boid[]): Boid[][] {
  const flocks = new Map<number, Boid[]>();
  for (const boid of boids) {
    const flock = flocks.get(boid.parentId) ?? [];
    flock.push(boid);
    flocks.set(boid.parentId, flock);
  }

  return [...flocks.values()];
}

function meanOverFlocks(
  boids: readonly Boid[],
  measure: (flock: Boid[]) => number,
): number {
  const perFlock = byFlock(boids).map(measure);

  return perFlock.reduce((sum, value) => sum + value, 0) / perFlock.length;
}

function meanOverPairs(
  flock: Boid[],
  measure: (a: Boid, b: Boid) => number | undefined,
): number {
  let total = 0;
  let pairs = 0;

  for (let i = 0; i < flock.length; i++) {
    for (let j = i + 1; j < flock.length; j++) {
      const value = measure(flock[i], flock[j]);
      if (value !== undefined) {
        total += value;
        pairs++;
      }
    }
  }

  return pairs > 0 ? total / pairs : 0;
}

export function meanHeadingAgreement(boids: readonly Boid[]): number {
  return meanOverFlocks(boids, (flock) =>
    meanOverPairs(flock, (a, b) => {
      const lengths = a.velocity.length() * b.velocity.length();

      return lengths > 0 ? a.velocity.dot(b.velocity) / lengths : undefined;
    }),
  );
}

export function meanIntraFlockDistance(boids: readonly Boid[]): number {
  return meanOverFlocks(boids, (flock) =>
    meanOverPairs(flock, (a, b) => a.position.distanceTo(b.position)),
  );
}

export function meanNearestNeighborDistance(boids: readonly Boid[]): number {
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
