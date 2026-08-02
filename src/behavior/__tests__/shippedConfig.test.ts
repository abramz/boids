import { describe, expect, it } from "vitest";
import Boid from "../Boid";
import * as config from "../../config";
import { runSimulation } from "./helpers/simulate";
import { SETTLED_STEPS as STEPS, SHIPPED, WORLD_SIZE } from "./helpers/shipped";

/**
 * The values config.ts actually ships, flown.
 *
 * Every other suite here runs on a fixture tuned to make one behaviour legible,
 * so a shipped factor can be wound to zero without a single test noticing. These
 * are the claims config.ts makes about its own numbers.
 */
const HALF_WORLD = WORLD_SIZE / 2;

const meanSpeed = (boids: readonly Boid[]): number =>
  boids.reduce((sum, boid) => sum + boid.velocity.length(), 0) / boids.length;

/** How far the furthest boid got from the middle of the world. */
const furthest = (boids: readonly Boid[]): number =>
  boids.reduce((worst, boid) => Math.max(worst, boid.position.length()), 0);

describe("the shipped configuration", () => {
  it("flies the flock rather than leaving it on the speed floor", () => {
    const shipped = runSimulation({ config: SHIPPED, steps: STEPS });
    const unaligned = runSimulation({
      config: SHIPPED,
      steps: STEPS,
      forceFactors: { alignmentFactor: 0 },
    });

    /* cohesion and separation oppose each other, and alignment is what carries
       the balance past their sum: without it the flock settles onto MIN_SPEED,
       which is a backstop rather than a speed model */
    expect(meanSpeed(shipped.boids)).toBeGreaterThan(config.MIN_SPEED * 1.25);
    expect(meanSpeed(shipped.boids)).toBeGreaterThan(
      meanSpeed(unaligned.boids) * 1.15,
    );
  });

  it("keeps the flock on the leash with edge avoidance shipped off", () => {
    const shipped = runSimulation({ config: SHIPPED, steps: STEPS });
    const loose = runSimulation({
      config: SHIPPED,
      steps: STEPS,
      forceFactors: { drawToCenterFactor: 0 },
    });

    /* the flock lives outside the box, so the bound is the leash's length and
       not the world's. Off it, nothing catches the flock at all and it is still
       leaving when the run ends. */
    expect(furthest(shipped.boids)).toBeLessThan(HALF_WORLD * 4);
    expect(furthest(loose.boids)).toBeGreaterThan(HALF_WORLD * 4);
  });

  it("still catches the flock at the loosest the panel allows", () => {
    /* four times settled, because what separates a long leash from no leash is
       whether the flock converges on a distance or is still leaving */
    const horizon = STEPS * 4;
    const floored = runSimulation({
      config: SHIPPED,
      steps: horizon,
      forceFactors: { drawToCenterFactor: config.MIN_DRAW_TO_CENTER_FACTOR },
    });
    const loose = runSimulation({
      config: SHIPPED,
      steps: horizon,
      forceFactors: { drawToCenterFactor: 0 },
    });

    /* what the floor buys is a bound, not a framing: at it the flock settles
       some eight half-worlds out, which is further than the camera is sized for
       and a viewer can pull back from. Off it there is no distance to pull back
       to. */
    expect(furthest(floored.boids)).toBeLessThan(HALF_WORLD * 10);
    expect(furthest(loose.boids)).toBeGreaterThan(HALF_WORLD * 10);
  });
});
