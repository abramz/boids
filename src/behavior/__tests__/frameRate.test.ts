import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { DENSE_CONFIG, runSimulation } from "./helpers/simulate";

/**
 * The simulation integrates on a clock, not on frames, so the same stretch of
 * simulated time has to produce the same flock however many frames it was cut
 * into. Chaos rules out comparing trajectories, a last-bit difference being
 * whole units apart within a second, so these compare what a frame-rate
 * dependency would visibly change: how fast the flock flies, and how far past
 * the wall it gets before the edge force turns it around.
 */
describe("frame rate independence", () => {
  const DURATION = 6; // simulated seconds
  const SLOWEST = 20;
  const FASTEST = 144;

  /**
   * Flocking switched off, leaving edge avoidance flying the boids on its own.
   *
   * Two runs of a flock diverge chaotically within a second, so how often any
   * of them happens to be at a wall becomes a coin toss rather than a
   * measurement. Left to itself the edge force gives every boid the same
   * deterministic bounce at either frame rate, which is the thing being
   * compared.
   */
  const EDGES_ONLY = {
    alignmentFactor: 0,
    cohesionFactor: 0,
    separationFactor: 0,
  };

  interface Flight {
    /**
     * How far past the world wall a boid sits on average, over the whole run.
     *
     * A time-average rather than the worst excursion: the fast run samples
     * seven times as often, so it catches sharper peaks of the same trajectory
     * and a max would read that sampling difference as a frame-rate effect.
     */
    overrun: number;
    /** mean distance a boid actually covered per simulated second */
    groundSpeed: number;
    /** mean of the speeds the boids reported while covering it */
    reportedSpeed: number;
  }

  function fly(fps: number, forceFactors = {}): Flight {
    let overrun = 0;
    let distance = 0;
    let speeds = 0;
    let samples = 0;
    const previous = new Map<string, THREE.Vector3>();
    const halfWorldSize = DENSE_CONFIG.worldSize / 2;

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
      /* the first step has nothing to measure against, so the ground covered
         spans one interval fewer than the run has frames */
      groundSpeed: distance / (((samples - 1) / fps) * boids.length),
      reportedSpeed: speeds / (samples * boids.length),
    };
  }

  it("turns the flock around at the same distance past the wall", () => {
    const slow = fly(SLOWEST, EDGES_ONLY);
    const fast = fly(FASTEST, EDGES_ONLY);

    // integrate acceleration without the delta and this becomes a function of
    // the frame rate, the slow machine's boids being the ones out beyond the
    // wall
    expect(slow.overrun).toBeGreaterThan(0);
    expect(slow.overrun / fast.overrun).toBeGreaterThan(0.75);
    expect(slow.overrun / fast.overrun).toBeLessThan(1.33);
  });

  it.each([SLOWEST, FASTEST])(
    "covers the ground its boids report covering at %ifps",
    (fps) => {
      const { groundSpeed, reportedSpeed } = fly(fps);

      // giving a boid one frame's delta for the two frames it waits between
      // updates halves this, quietly making MAX_SPEED mean half what it says.
      // Ground speed sits a hair under, summing chords along a curve.
      expect(reportedSpeed).toBeGreaterThan(0);
      expect(groundSpeed / reportedSpeed).toBeGreaterThan(0.95);
      expect(groundSpeed / reportedSpeed).toBeLessThan(1.01);
    },
  );
});
