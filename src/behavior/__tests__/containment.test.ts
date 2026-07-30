import { describe, expect, it } from "vitest";
import { runSimulation } from "./helpers/simulate";

/**
 * BoidStore.reindex throws for a boid outside the tree, so stepSimulation
 * clamps every position into it before rebuilding rather than letting a frame
 * take the simulation down. These pin the clamp: that it catches the boids
 * edge avoidance could not turn in time, and that it stays out of the way of
 * the ones it could.
 */
describe("boid containment", () => {
  // ~5fps: under MAX_DELTA, so it is integrated rather than discarded, and far
  // enough in one step that avoidEdges cannot steer back
  const SLOW_FRAME = 0.2;

  it("keeps every boid inside the tree when a slow frame overshoots", () => {
    const { simulation, boids } = runSimulation({
      steps: 300,
      delta: SLOW_FRAME,
      forceFactors: { avoidEdgesFactor: 0 },
    });

    const escaped = boids
      .filter(
        (boid) => !simulation.storage.boundary.containsPoint(boid.position),
      )
      .map((boid) => boid.compoundId);

    expect(escaped).toEqual([]);
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

  it("does not engage at a normal frame rate", () => {
    /* the clamp is a safety net; boids running normally should never reach the
       boundary. Checked every frame rather than at the end, because a boid
       pinned mid-run steps off again and leaves nothing behind to find. */
    const pinned: string[] = [];

    runSimulation({
      steps: 120,
      onStep: ({ storage, boids }) => {
        const { min, max } = storage.boundary;

        boids.forEach((boid) => {
          const onWall = (["x", "y", "z"] as const).some(
            (axis) =>
              boid.position[axis] === min[axis] ||
              boid.position[axis] === max[axis],
          );
          if (onWall) {
            pinned.push(boid.compoundId);
          }
        });
      },
    });

    expect(pinned).toEqual([]);
  });
});
