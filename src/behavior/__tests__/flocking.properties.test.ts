import { describe, expect, it } from "vitest";
import Boid from "../Boid";
import {
  meanHeadingAgreement,
  meanIntraFlockDistance,
  meanNearestNeighbourDistance,
  runSimulation,
} from "./helpers/simulate";

/**
 * Controlled comparisons - the same seeded world with one force switched off -
 * so the assertions survive a correct refactor and any three.js version.
 */
describe("emergent flocking behaviour", () => {
  it("alignment makes flockmates head the same way", async () => {
    const aligned = await runSimulation();
    const unaligned = await runSimulation({
      forceFactors: { alignmentFactor: 0 },
    });

    expect(meanHeadingAgreement(aligned.boids)).toBeGreaterThan(
      meanHeadingAgreement(unaligned.boids),
    );
  });

  it("cohesion pulls flockmates closer together", async () => {
    const cohesive = await runSimulation();
    const scattered = await runSimulation({
      forceFactors: { cohesionFactor: 0 },
    });

    expect(meanIntraFlockDistance(cohesive.boids)).toBeLessThan(
      meanIntraFlockDistance(scattered.boids),
    );
  });

  it("separation keeps boids off each other", async () => {
    const separated = await runSimulation();
    const crowded = await runSimulation({
      forceFactors: { separationFactor: 0 },
    });

    expect(meanNearestNeighbourDistance(separated.boids)).toBeGreaterThan(
      meanNearestNeighbourDistance(crowded.boids),
    );
  });

  it("every force contributes at some point", async () => {
    const live = new Set<string>();
    const record = (boids: Boid[]) => {
      boids.forEach((boid) => {
        (Object.keys(boid.forces) as (keyof Boid["forces"])[]).forEach(
          (key) => {
            const [x, y, z] = boid.forces[key];
            if (x !== 0 || y !== 0 || z !== 0) {
              live.add(key);
            }
          },
        );
      });
    };

    await runSimulation({ steps: 90, onStep: record });

    // seek and avoidance need a pointer target this headless run cannot supply
    ["alignment", "cohesion", "separation", "avoidEdges"].forEach((force) =>
      expect(live.has(force), `${force} never contributed`).toBe(true),
    );
  });
});
