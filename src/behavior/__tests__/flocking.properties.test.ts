import * as THREE from "three";
import { describe, expect, it } from "vitest";
import Boid from "../Boid";
import {
  FLOCKING_CONFIG,
  meanHeadingAgreement,
  meanIntraFlockDistance,
  meanNearestNeighborDistance,
  runSimulation,
} from "./helpers/simulate";

describe("emergent flocking behavior", () => {
  it("alignment makes flockmates head the same way", () => {
    const aligned = runSimulation();
    const unaligned = runSimulation({ forceFactors: { alignmentFactor: 0 } });

    expect(meanHeadingAgreement(aligned.boids)).toBeGreaterThan(
      meanHeadingAgreement(unaligned.boids),
    );
  });

  it("cohesion pulls flockmates closer together", () => {
    const cohesive = runSimulation({ steps: 600 });
    const scattered = runSimulation({
      steps: 600,
      forceFactors: { cohesionFactor: 0 },
    });

    expect(meanIntraFlockDistance(cohesive.boids)).toBeLessThan(
      meanIntraFlockDistance(scattered.boids) * 0.9,
    );
  });

  it("separation keeps boids off each other", () => {
    const separated = runSimulation();
    const crowded = runSimulation({ forceFactors: { separationFactor: 0 } });

    expect(meanNearestNeighborDistance(separated.boids)).toBeGreaterThan(
      meanNearestNeighborDistance(crowded.boids),
    );
  });

  it("holds a heading rather than spinning on the spot", () => {
    const meanTurnPerFrame = (minSpeed: number) => {
      const previous = new Map<string, THREE.Vector3>();
      let total = 0;
      let samples = 0;

      runSimulation({
        steps: 200,
        properties: { minSpeed },
        onStep: ({ boids }, step) => {
          boids.forEach((boid) => {
            const heading = boid.velocity.clone().normalize();
            const before = previous.get(boid.compoundId);
            if (before && step > 60 && heading.lengthSq() > 0) {
              total += before.angleTo(heading);
              samples++;
            }
            previous.set(boid.compoundId, heading);
          });
        },
      });

      return total / samples;
    };

    expect(meanTurnPerFrame(FLOCKING_CONFIG.properties.minSpeed)).toBeLessThan(
      meanTurnPerFrame(0),
    );
  });

  it("every force contributes at some point", () => {
    const live = new Set<string>();

    runSimulation({
      steps: 90,
      onStep: ({ boids }) =>
        boids.forEach((boid) => {
          (Object.keys(boid.forces) as (keyof Boid["forces"])[]).forEach(
            (key) => {
              const [x, y, z] = boid.forces[key];
              if (x !== 0 || y !== 0 || z !== 0) {
                live.add(key);
              }
            },
          );
        }),
    });

    (
      [
        "alignment",
        "cohesion",
        "separation",
        "avoidEdges",
        "avoidObstacles",
        "drawToCenter",
      ] as const
    ).forEach((force) =>
      expect(live.has(force), `${force} never contributed`).toBe(true),
    );
  });
});
