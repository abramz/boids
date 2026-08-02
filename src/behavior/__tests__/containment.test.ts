import { describe, expect, it } from "vitest";
import Boid from "../Boid";
import { FLOCKING_CONFIG, runSimulation } from "./helpers/simulate";

/**
 * The world is what the boids steer to stay inside, not a wall they are held
 * against: the index reaches everywhere and nothing clamps a position, so
 * containment is entirely a matter of the forces.
 */
describe("boid containment", () => {
  const halfWorld = FLOCKING_CONFIG.worldSize / 2;

  /** How far past the world the furthest boid got, on its furthest axis. */
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

    /* the leash settles the flock out past the wall rather than at it, so what
       is pinned here is that it is still caught at all */
    expect(worstExcursion(boids)).toBeLessThan(FLOCKING_CONFIG.worldSize);
  });

  it("holds the flock at the world with edge avoidance on", () => {
    // ~5fps: under MAX_DELTA, so it is integrated rather than discarded, and
    // far enough in one step that avoidEdges is having to work for it
    const held = runSimulation({ steps: 300, delta: 0.2 });
    const leashAlone = runSimulation({
      steps: 300,
      delta: 0.2,
      forceFactors: { avoidEdgesFactor: 0 },
    });

    /* the leash on its own already holds the flock inside a world's width, so
       the bound has to be one only the wall can meet */
    expect(worstExcursion(held.boids)).toBeLessThan(halfWorld / 2);
    expect(worstExcursion(leashAlone.boids)).toBeGreaterThan(halfWorld / 2);
  });

  it("keeps every boid clear of the obstacles it steers around", () => {
    /* boids are scattered at random, so a few set off from beside an obstacle
       already pointed at it and turning takes a braking distance they have not
       been given; past that there is no excuse for being inside one */
    const SETTLED_BY = 60;
    let deepest = 0;

    const { simulation } = runSimulation({
      steps: 300,
      // the shipped weight rather than the gentle one the flocking suites use,
      // since this is asking whether obstacle avoidance actually holds
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
