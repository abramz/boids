import * as THREE from "three";
import { describe, expect, it } from "vitest";
import Boid from "../Boid";
import deriveBoidProperties from "../deriveBoidProperties";
import { isInFOV } from "../../helpers/math";
import { DENSE_CONFIG, runSimulation } from "./helpers/simulate";

/**
 * A boid with flockmates in range must actually steer by them.
 *
 * OctTree.queryRange returns whole cells without filtering, so a query narrower
 * than perceptionRadius does not return nothing - it returns the boid's own
 * cell. Flocking then runs on an arbitrary spatial subset and still looks
 * plausible, which is why this asserts on the forces rather than on the query.
 */
describe("neighbour discovery", () => {
  it("gives every boid with flockmates in range a non-zero alignment force", async () => {
    const { boids } = await runSimulation({ steps: 30 });
    const { perceptionRadius, fieldOfViewDeg } = deriveBoidProperties(
      DENSE_CONFIG.properties,
    );
    const fieldOfViewRad = fieldOfViewDeg * THREE.MathUtils.DEG2RAD;

    const toNeighbour = new THREE.Vector3();
    const forward = new THREE.Vector3();
    const canSee = (boid: Boid, other: Boid) => {
      toNeighbour.subVectors(other.position, boid.position);
      const distance = toNeighbour.length();
      if (distance === 0 || distance > perceptionRadius) {
        return false;
      }

      forward.copy(boid.velocity).normalize();

      return isInFOV(toNeighbour.normalize(), forward, fieldOfViewRad);
    };

    const blind = boids
      .filter((boid) => {
        const visibleFlockmates = boids.filter(
          (other) =>
            other.parentId === boid.parentId &&
            other.coumpundId !== boid.coumpundId &&
            canSee(boid, other),
        );
        const [x, y, z] = boid.forces.alignment;

        return visibleFlockmates.length > 0 && x === 0 && y === 0 && z === 0;
      })
      .map((boid) => boid.coumpundId);

    expect(blind).toEqual([]);
  });
});
