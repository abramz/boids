import { describe, expect, it } from "vitest";
import Boid from "../Boid";
import { DENSE_CONFIG, runSimulation } from "./helpers/simulate";

/**
 * The world is what the boids steer to stay inside, not a wall they are held
 * against: the index reaches everywhere, and nothing clamps a position. So
 * containment is entirely a matter of the forces, and these are what pin it -
 * that edge avoidance holds the flock in while it is on, that the draw to
 * center holds it near when edge avoidance is off, and that the draw to center
 * is doing nothing at all the rest of the time.
 */
describe("boid containment", () => {
  const halfWorld = DENSE_CONFIG.worldSize / 2;

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

  it("holds the flock near the world with edge avoidance switched off", () => {
    /* the leash, and the only thing left holding the flock once the wall it
       normally turns at is gone. Without it there is nothing to stop the flock
       flying off for good, and no boundary left for it to be caught at. */
    const { boids } = runSimulation({
      steps: 600,
      forceFactors: { avoidEdgesFactor: 0 },
    });

    /* it settles where cohesion and the draw to center balance, which is out
       past the wall rather than at it: this is a leash, not a replacement */
    expect(worstExcursion(boids)).toBeLessThan(DENSE_CONFIG.worldSize);
  });

  it("holds the flock at the world with edge avoidance on", () => {
    // ~5fps: under MAX_DELTA, so it is integrated rather than discarded, and
    // far enough in one step that avoidEdges is having to work for it
    const { boids } = runSimulation({ steps: 300, delta: 0.2 });

    expect(worstExcursion(boids)).toBeLessThan(halfWorld);
  });

  it("draws nothing towards the center while a boid is inside the world", () => {
    /* zero inside the world is what keeps this out of the flocking balance
       entirely, so it is the property worth pinning rather than the shape of
       the ramp outside */
    const { simulation, boids } = runSimulation({ steps: 120 });

    // half the flock re-aims per frame, so a force read now is a frame old for
    // half of them; two steps at delta 0 re-aim both halves against positions
    // nothing can have moved from
    for (let pass = 0; pass < 2; pass++) {
      simulation.step({
        delta: 0,
        properties: DENSE_CONFIG.properties,
        forceFactors: DENSE_CONFIG.forceFactors,
      });
    }

    const drawn = boids
      .filter((boid) => simulation.worldBoundary.containsPoint(boid.position))
      .filter((boid) => boid.forces.drawToCenter.some((axis) => axis !== 0))
      .map((boid) => boid.compoundId);

    expect(drawn).toEqual([]);
  });

  it("keeps every boid clear of the obstacles it steers around", () => {
    /* the unit tests pin the force a single obstacle produces; this is the
       thing that force exists for, which is that a boid flying the real
       simulation does not end up inside one.

       Measured once the flock has settled. Boids are scattered at random to
       begin with, so a few set off from beside an obstacle already pointed at
       it, and turning takes a braking distance they have not been given - the
       same constraint the walls impose. Past that there is no excuse for a
       boid ever being inside one. */
    const SETTLED_BY = 60;
    let deepest = 0;

    runSimulation({
      steps: 300,
      // the shipped weight rather than the gentle one the flocking suites use,
      // since this is asking whether obstacle avoidance actually holds
      forceFactors: { avoidObstaclesFactor: 50 },
      onStep: ({ boids, storage }, step) => {
        if (step < SETTLED_BY) {
          return;
        }

        boids.forEach((boid) => {
          storage.obstacles.forEach((obstacle) => {
            const into =
              obstacle.radius - boid.position.distanceTo(obstacle.position);
            deepest = Math.max(deepest, into);
          });
        });
      },
    });

    expect(deepest).toBe(0);
  });
});
