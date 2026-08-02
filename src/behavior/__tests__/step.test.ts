import { describe, expect, it } from "vitest";
import deriveBoidProperties from "../deriveBoidProperties";
import stepSimulation from "../step";
import {
  FLOCKING_CONFIG,
  FRAME_DELTA,
  runSimulation,
} from "./helpers/simulate";

describe("excessive frame deltas", () => {
  const MAX_DELTA = FLOCKING_CONFIG.world.maxDelta!;

  function stepOnce(delta: number) {
    const { simulation, boids } = runSimulation({ steps: 1 });
    const before = boids.map((boid) => boid.position.clone());

    const nextFrameSign = stepSimulation({
      grid: simulation.grid,
      boids: simulation.boids,
      obstacles: simulation.obstacles,
      frameSign: 1,
      delta,
      maxDelta: MAX_DELTA,
      properties: deriveBoidProperties(FLOCKING_CONFIG.properties),
      forceFactors: FLOCKING_CONFIG.forceFactors,
      worldBoundary: simulation.worldBoundary,
    });

    return { boids, before, nextFrameSign };
  }

  it("drops a frame past the limit and integrates one right on it", () => {
    const dropped = stepOnce(MAX_DELTA + 0.1);

    dropped.boids.forEach((boid, index) => {
      expect(boid.position.toArray()).toEqual(dropped.before[index].toArray());
    });

    const integrated = stepOnce(MAX_DELTA);

    expect(
      integrated.boids.some(
        (boid, index) => !boid.position.equals(integrated.before[index]),
      ),
    ).toBe(true);
  });

  it("leaves the half-frame where it was when it drops one", () => {
    expect(stepOnce(MAX_DELTA + 0.1).nextFrameSign).toBe(1);
    expect(stepOnce(FRAME_DELTA).nextFrameSign).toBe(-1);
  });
});
