import { beforeAll, describe, expect, it } from "vitest";
import Boid from "../Boid";
import * as config from "../../config";
import { runSimulation } from "./helpers/simulate";
import { SETTLED_STEPS as STEPS, SHIPPED, WORLD_SIZE } from "./helpers/shipped";

const HALF_WORLD = WORLD_SIZE / 2;

const meanSpeed = (boids: readonly Boid[]): number =>
  boids.reduce((sum, boid) => sum + boid.velocity.length(), 0) / boids.length;

const furthest = (boids: readonly Boid[]): number =>
  boids.reduce((worst, boid) => Math.max(worst, boid.position.length()), 0);

describe("the shipped configuration", () => {
  let shipped: ReturnType<typeof runSimulation>;

  beforeAll(() => {
    shipped = runSimulation({ config: SHIPPED, steps: STEPS });
  });

  it("flies the flock rather than leaving it on the speed floor", () => {
    const unaligned = runSimulation({
      config: SHIPPED,
      steps: STEPS,
      forceFactors: { alignmentFactor: 0 },
    });

    expect(meanSpeed(shipped.boids)).toBeGreaterThan(config.MIN_SPEED * 1.25);
    expect(meanSpeed(shipped.boids)).toBeGreaterThan(
      meanSpeed(unaligned.boids) * 1.15,
    );
  });

  it("keeps the flock on the leash with edge avoidance shipped off", () => {
    const loose = runSimulation({
      config: SHIPPED,
      steps: STEPS,
      forceFactors: { drawToCenterFactor: 0 },
    });

    expect(furthest(shipped.boids)).toBeLessThan(HALF_WORLD * 4);
    expect(furthest(loose.boids)).toBeGreaterThan(HALF_WORLD * 4);
  });

  it("still catches the flock at the loosest the panel allows", () => {
    const excursion = (drawToCenterFactor: number): number => {
      let peak = 0;
      runSimulation({
        config: SHIPPED,
        steps: STEPS * 2,
        forceFactors: { drawToCenterFactor },
        onStep: ({ boids }) => {
          peak = Math.max(peak, furthest(boids));
        },
      });

      return peak;
    };

    expect(excursion(config.MIN_DRAW_TO_CENTER_FACTOR)).toBeLessThan(
      HALF_WORLD * 13,
    );
    expect(excursion(0)).toBeGreaterThan(HALF_WORLD * 13);
  });
});
