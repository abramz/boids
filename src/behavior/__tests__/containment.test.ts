import { describe, expect, it } from "vitest";
import Boid from "../Boid";
import { FLOCKING_CONFIG, runSimulation } from "./helpers/simulate";

describe("boid containment", () => {
  const halfWorld = FLOCKING_CONFIG.worldSize / 2;

  function worstExcursion(boids: readonly Boid[]): number {
    return boids.reduce(
      (worst, boid) =>
        (["x", "y", "z"] as const).reduce(
          (axisWorst, axis) =>
            Math.max(axisWorst, Math.abs(boid.position[axis]) - halfWorld),
          worst,
        ),
      0,
    );
  }

  it("catches a flock that would otherwise leave for good", () => {
    const { boids } = runSimulation({
      steps: 600,
      forceFactors: { avoidEdgesFactor: 0 },
    });

    expect(worstExcursion(boids)).toBeLessThan(FLOCKING_CONFIG.worldSize);
  });

  it("holds the flock at the world with edge avoidance on", () => {
    const held = runSimulation({ steps: 300, delta: 0.2 });
    const leashAlone = runSimulation({
      steps: 300,
      delta: 0.2,
      forceFactors: { avoidEdgesFactor: 0 },
    });

    expect(worstExcursion(held.boids)).toBeLessThan(halfWorld / 2);
    expect(worstExcursion(leashAlone.boids)).toBeGreaterThan(halfWorld / 2);
  });

  it("keeps every boid clear of the obstacles it steers around", () => {
    const SETTLED_BY = 60;
    let deepest = 0;

    const { simulation } = runSimulation({
      steps: 300,
      forceFactors: { avoidObstaclesFactor: 50 },
      onStep: ({ boids, obstacles }, step) => {
        if (step < SETTLED_BY) {
          return;
        }

        boids.forEach((boid) => {
          obstacles.forEach((obstacle) => {
            const into =
              obstacle.radius - boid.position.distanceTo(obstacle.position);
            deepest = Math.max(deepest, into);
          });
        });
      },
    });

    expect(simulation.obstacles.length).toBeGreaterThan(0);
    expect(deepest).toBe(0);
  });
});
