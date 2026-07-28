import { describe, expect, it } from "vitest";
import { runSimulation } from "./helpers/simulate";

/**
 * BoidStore.insert throws for a boid outside the tree, and stepSimulation
 * re-inserts every boid on the negative half-frame - so an escape takes the
 * simulation down through the error boundary rather than dropping a boid.
 */
describe("boid containment", () => {
  // ~5fps: under MAX_DELTA, so it is integrated rather than discarded, and far
  // enough in one step that avoidEdges cannot steer back
  const SLOW_FRAME = 0.2;

  it("keeps every boid inside the tree when a slow frame overshoots", async () => {
    const { storage, boids } = await runSimulation({
      steps: 300,
      delta: SLOW_FRAME,
      forceFactors: { avoidEdgesFactor: 0 },
    });

    const escaped = boids
      .filter((boid) => !storage.boundary.containsPoint(boid.position))
      .map((boid) => boid.coumpundId);

    expect(escaped).toEqual([]);
  });

  it("does not engage at a normal frame rate", async () => {
    // the clamp is a safety net; boids running normally should never reach the
    // boundary, so none of them should be sitting exactly on it
    const { storage, boids } = await runSimulation({ steps: 120 });
    const { min, max } = storage.boundary;

    const pinned = boids
      .filter((boid) =>
        (["x", "y", "z"] as const).some(
          (axis) =>
            boid.position[axis] === min[axis] ||
            boid.position[axis] === max[axis],
        ),
      )
      .map((boid) => boid.coumpundId);

    expect(pinned).toEqual([]);
  });
});
