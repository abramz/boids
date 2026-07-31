import * as THREE from "three";
import { describe, expect, it } from "vitest";
import Boid from "../Boid";
import Candidates from "../../storage/Candidates";
import deriveBoidProperties from "../deriveBoidProperties";
import { isInFOV } from "../../helpers/math";
import { DENSE_CONFIG, runSimulation } from "./helpers/simulate";

/**
 * A boid with flockmates in range must actually steer by them.
 *
 * The index is the one part of a frame a boid cannot check for itself: hand it
 * back the wrong neighbourhood and flocking runs on an arbitrary spatial subset
 * while still looking entirely plausible. So these work out what each boid
 * should be able to see from the positions alone, and assert the simulation
 * agreed.
 */
describe("neighbour discovery", () => {
  const properties = deriveBoidProperties(DENSE_CONFIG.properties);

  it("gives every boid with flockmates in range a non-zero alignment force", () => {
    const { simulation, boids } = runSimulation({ steps: 30 });
    const cosHalfFOV = Math.cos(
      (properties.fieldOfViewDeg * THREE.MathUtils.DEG2RAD) / 2,
    );

    // Only half the flock re-aims per frame while all of it flies, so at the
    // end of a run half the forces answer a neighbourhood one frame old. Two
    // more steps at delta 0 re-aim both halves against positions nothing can
    // have moved from, which is the question this is actually asking.
    for (let pass = 0; pass < 2; pass++) {
      simulation.step({
        delta: 0,
        properties: DENSE_CONFIG.properties,
        forceFactors: DENSE_CONFIG.forceFactors,
      });
    }

    const toNeighbour = new THREE.Vector3();
    const forward = new THREE.Vector3();
    const canSee = (boid: Boid, other: Boid) => {
      toNeighbour.subVectors(other.position, boid.position);
      const distance = toNeighbour.length();
      if (distance === 0 || distance > properties.perceptionRadius) {
        return false;
      }

      forward.copy(boid.velocity).normalize();

      return isInFOV(toNeighbour.normalize(), forward, cosHalfFOV);
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
  });

  it("keeps the index level with the flock as it moves", () => {
    /* stop rebuilding the index and every boid quietly goes on flocking
       against where the flock was at t=0, which looks entirely plausible and
       is why this asserts the neighbourhood rather than the frame count */
    const { simulation, boids } = runSimulation({ steps: 300 });
    const range = new THREE.Sphere();
    const candidates = new Candidates<Boid>();

    const missed = boids.flatMap((boid) => {
      simulation.storage.queryRange(
        range.set(boid.position, properties.perceptionRadius),
        candidates,
      );
      const found = new Set(candidates);

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
});
