import { describe, expect, it } from "vitest";
import deriveBoidProperties from "../deriveBoidProperties";
import stepSimulation from "../step";
import {
  FLOCKING_CONFIG,
  FRAME_DELTA,
  runSimulation,
} from "./helpers/simulate";

describe("excessive frame deltas", () => {
  /* the fixture's own, like every other number these suites run on */
  const MAX_DELTA = FLOCKING_CONFIG.world.maxDelta!;

  function stepOnce(delta: number) {
    const { simulation, boids } = runSimulation({ steps: 1 });
    const before = boids.map((boid) => boid.position.clone());

    const nextFrameSign = stepSimulation({
      storage: simulation.storage,
      boids,
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
    // a boid covers maxSpeed * delta in a step: integrate a long one and it
    // arrives somewhere it never flew through, having missed whatever it
    // should have steered around on the way
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
    // the halves alternate, so consuming a turn on a frame nothing moved in
    // would hand the re-aim to the wrong half of the flock
    expect(stepOnce(MAX_DELTA + 0.1).nextFrameSign).toBe(1);
    expect(stepOnce(FRAME_DELTA).nextFrameSign).toBe(-1);
  });
});
