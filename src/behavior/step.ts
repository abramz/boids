import * as THREE from "three";
import HashGrid from "../storage/HashGrid";
import QueryResults from "../storage/QueryResults";
import Obstacle from "../obstacle/Obstacle";
import Boid, { DerivedBoidProperties, ForceFactors } from "./Boid";

const tempBoundary = new THREE.Sphere();
const tempNeighbors = new QueryResults<Boid>();

export interface StepSimulationOptions {
  grid: HashGrid<Boid>;
  boids: readonly Boid[];
  obstacles: readonly Obstacle[];
  frameSign: number;
  delta: number;
  maxDelta: number;
  properties: DerivedBoidProperties;
  forceFactors: ForceFactors;
  worldBoundary: THREE.Box3;
}

export default function stepSimulation({
  grid,
  boids,
  obstacles,
  frameSign,
  delta,
  maxDelta,
  properties,
  forceFactors,
  worldBoundary,
}: StepSimulationOptions): number {
  if (delta > maxDelta) {
    return frameSign;
  }

  const halfSize = Math.floor(boids.length / 2);
  const start = frameSign > 0 ? 0 : halfSize;
  const end = frameSign > 0 ? halfSize : boids.length;

  for (let index = start; index < end; index++) {
    const boid = boids[index];
    tempBoundary.set(boid.position, properties.perceptionRadius);
    grid.queryRange(tempBoundary, tempNeighbors);

    boid.applyForces({
      neighbors: tempNeighbors,
      obstacles,
      boundary: worldBoundary,
      properties,
      forceFactors,
    });
  }

  for (const boid of boids) {
    boid.applyAcceleration(delta, properties.minSpeed, properties.maxSpeed);
    boid.applyVelocity(delta);
  }

  grid.build(boids);

  return frameSign * -1;
}
