import * as THREE from "three";
import { describe, expect, it } from "vitest";
import Boid from "../Boid";
import QueryResults from "../../storage/QueryResults";
import deriveBoidProperties from "../deriveBoidProperties";
import { isInFOV } from "../../helpers/math";
import { FLOCKING_CONFIG, runSimulation } from "./helpers/simulate";

describe("neighbor discovery", () => {
  const properties = deriveBoidProperties(FLOCKING_CONFIG.properties);

  it("hands every boid the flockmates it can see, and steers it by them", () => {
    const { simulation, boids } = runSimulation({ steps: 300 });
    const cosHalfFOV = Math.cos(
      (properties.fieldOfViewDeg * THREE.MathUtils.DEG2RAD) / 2,
    );

    for (let pass = 0; pass < 2; pass++) {
      simulation.step({
        delta: 0,
        properties: FLOCKING_CONFIG.properties,
        forceFactors: FLOCKING_CONFIG.forceFactors,
      });
    }

    const toNeighbor = new THREE.Vector3();
    const forward = new THREE.Vector3();
    const canSee = (boid: Boid, other: Boid) => {
      toNeighbor.subVectors(other.position, boid.position);
      const distance = toNeighbor.length();
      if (distance === 0 || distance > properties.perceptionRadius) {
        return false;
      }

      forward.copy(boid.velocity).normalize();

      return isInFOV(toNeighbor.normalize(), forward, cosHalfFOV);
    };

    const blind = boids
      .filter((boid) => {
        const sighted = boids.some(
          (other) =>
            other.parentId === boid.parentId &&
            other !== boid &&
            canSee(boid, other),
        );
        const [x, y, z] = boid.forces.alignment;

        return sighted && x === 0 && y === 0 && z === 0;
      })
      .map((boid) => boid.compoundId);

    expect(blind).toEqual([]);

    const range = new THREE.Sphere();
    const results = new QueryResults<Boid>();

    const missed = boids.flatMap((boid) => {
      simulation.grid.queryRange(
        range.set(boid.position, properties.perceptionRadius),
        results,
      );
      const found = new Set(results);

      return boids
        .filter(
          (other) =>
            other.position.distanceTo(boid.position) <=
              properties.perceptionRadius && !found.has(other),
        )
        .map((other) => `${boid.compoundId} could not see ${other.compoundId}`);
    });

    expect(missed).toEqual([]);
  });

  it("keeps the index level with the flock on every frame, not every other one", () => {
    const range = new THREE.Sphere();
    const results = new QueryResults<Boid>();
    const missed: string[] = [];

    runSimulation({
      steps: 120,
      delta: 0.2,
      onStep: ({ grid, boids }, step) => {
        if (step < 100 || missed.length > 0) {
          return;
        }

        boids.forEach((boid) => {
          grid.queryRange(
            range.set(boid.position, properties.perceptionRadius),
            results,
          );
          const found = new Set(results);

          boids.forEach((other) => {
            if (
              other !== boid &&
              other.position.distanceTo(boid.position) <=
                properties.perceptionRadius &&
              !found.has(other)
            ) {
              missed.push(
                `frame ${step}: ${boid.compoundId} could not see ${other.compoundId}`,
              );
            }
          });
        });
      },
    });

    expect(missed).toEqual([]);
  });
});
