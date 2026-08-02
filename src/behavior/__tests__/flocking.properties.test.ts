import * as THREE from "three";
import { describe, expect, it } from "vitest";
import Boid from "../Boid";
import {
  FLOCKING_CONFIG,
  meanHeadingAgreement,
  meanIntraFlockDistance,
  meanNearestNeighbourDistance,
  runSimulation,
} from "./helpers/simulate";

/**
 * Controlled comparisons, the same seeded world with one force switched off,
 * so the assertions survive a correct refactor and any three.js version.
 */
describe("emergent flocking behaviour", () => {
  it("alignment makes flockmates head the same way", () => {
    const aligned = runSimulation();
    const unaligned = runSimulation({ forceFactors: { alignmentFactor: 0 } });

    expect(meanHeadingAgreement(aligned.boids)).toBeGreaterThan(
      meanHeadingAgreement(unaligned.boids),
    );
  });

  it("cohesion pulls flockmates closer together", () => {
    /* run long enough for the two to separate by more than the noise: over the
       first couple of hundred frames a flock still unwinding from its scatter
       is drawing in under separation and the walls whether cohesion is on or
       not, and the two arms sit within a percent of each other */
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

    expect(meanNearestNeighbourDistance(separated.boids)).toBeGreaterThan(
      meanNearestNeighbourDistance(crowded.boids),
    );
  });

  it("holds a heading rather than spinning on the spot", () => {
    /* a boid turns through maxForce/speed radians a second, so the slower it is
       left flying the faster it can be spun. Cohesion and separation oppose
       each other in a packed flock and the balance between them settles at a
       crawl, which reads as jitter rather than as flight. */
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
            /* measured once the flock has settled, not while it is still
               unwinding from its seeded scatter */
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

    /* createSimulation builds the obstacle lattice on every run, headless
       included, and FLOCKING_CONFIG flies every factor at 1, so every force in
       the record is reachable from here: a force that never fires is one wired
       to nothing rather than one this world does not ask for */
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
