import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { FLOCKING_CONFIG, runSimulation } from "./helpers/simulate";

describe("frame rate independence", () => {
  const DURATION = 6;
  const SLOWEST = 20;
  const FASTEST = 144;

  const CONTAINMENT_ONLY = {
    alignmentFactor: 0,
    cohesionFactor: 0,
    separationFactor: 0,
  };

  interface Flight {
    overrun: number;
    groundSpeed: number;
    reportedSpeed: number;
  }

  function fly(fps: number, forceFactors = {}): Flight {
    let overrun = 0;
    let distance = 0;
    let speeds = 0;
    let samples = 0;
    const previous = new Map<string, THREE.Vector3>();
    const halfWorldSize = FLOCKING_CONFIG.worldSize / 2;

    const { boids } = runSimulation({
      steps: Math.round(DURATION * fps),
      delta: 1 / fps,
      forceFactors,
      onStep: (simulation) => {
        simulation.boids.forEach((boid) => {
          overrun += (["x", "y", "z"] as const).reduce(
            (worst, axis) =>
              Math.max(worst, Math.abs(boid.position[axis]) - halfWorldSize, 0),
            0,
          );

          const was = previous.get(boid.compoundId);
          if (was) {
            distance += was.distanceTo(boid.position);
          }
          previous.set(boid.compoundId, boid.position.clone());

          speeds += boid.velocity.length();
        });
        samples++;
      },
    });

    return {
      overrun: overrun / (samples * boids.length),
      groundSpeed: distance / (((samples - 1) / fps) * boids.length),
      reportedSpeed: speeds / (samples * boids.length),
    };
  }

  it("turns the flock around at the same distance past the wall", () => {
    const slow = fly(SLOWEST, CONTAINMENT_ONLY);
    const fast = fly(FASTEST, CONTAINMENT_ONLY);

    expect(slow.overrun).toBeGreaterThan(0);
    expect(slow.overrun / fast.overrun).toBeGreaterThan(0.75);
    expect(slow.overrun / fast.overrun).toBeLessThan(1.33);
  });

  it.each([SLOWEST, FASTEST])(
    "covers the ground its boids report covering at %ifps",
    (fps) => {
      const { groundSpeed, reportedSpeed } = fly(fps);

      expect(reportedSpeed).toBeGreaterThan(0);
      expect(groundSpeed / reportedSpeed).toBeGreaterThan(0.95);
      expect(groundSpeed / reportedSpeed).toBeLessThan(1.01);
    },
  );
});
