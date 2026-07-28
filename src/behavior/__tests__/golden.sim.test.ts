import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import * as THREE from "three";
import { beforeAll, describe, expect, it } from "vitest";
import * as seeded from "../../__mocks__/seededConfig";
import {
  CHECKPOINTS,
  GoldenFixture,
  captureGolden,
  compare,
  describeDivergences,
} from "./helpers/golden";

/**
 * Re-record after a deliberate change:
 *   UPDATE_GOLDEN=1 npx vitest run golden.sim
 * which writes the fixture and then fails, so a run with the variable set
 * cannot be mistaken for a passing one.
 */
const FIXTURE = resolve(
  process.cwd(),
  "src/__fixtures__/golden.simulation.json",
);

describe("golden simulation", () => {
  let actual: GoldenFixture;

  beforeAll(async () => {
    actual = await captureGolden();
  });

  it("matches the recorded trajectory", () => {
    if (process.env.UPDATE_GOLDEN) {
      writeFileSync(FIXTURE, `${JSON.stringify(actual, null, 2)}\n`);
      expect.fail(
        `golden re-recorded against three r${actual.meta.three}; re-run without UPDATE_GOLDEN`,
      );
    }

    const expected: GoldenFixture = JSON.parse(readFileSync(FIXTURE, "utf8"));

    // if three's seeded RNG or setFromSpherical moved, every boid starts
    // somewhere else and the per-frame comparison below is noise
    const drifted = compare(expected.initial, actual.initial, "initial");
    expect(
      drifted,
      `initial conditions changed - recorded against three r${expected.meta.three}, running r${actual.meta.three}\n` +
        describeDivergences(drifted),
    ).toEqual([]);

    CHECKPOINTS.forEach((frame) => {
      const divergences = compare(
        expected.frames[String(frame)],
        actual.frames[String(frame)],
        `frame ${frame}`,
      );

      expect(divergences, describeDivergences(divergences)).toEqual([]);
    });
  });

  it("is reproducible across runs", async () => {
    const first = await captureGolden(10);
    const second = await captureGolden(10);

    expect(second.frames["10"]).toEqual(first.frames["10"]);
  });

  // these hold regardless of float drift, so they survive a re-record: the
  // fixture detects change, these detect breakage
  describe("invariants", () => {
    it("stays finite, inside the world, and within the speed limit", () => {
      const position = new THREE.Vector3();

      Object.entries(actual.frames).forEach(([frame, boids]) => {
        Object.entries(boids).forEach(([id, [px, py, pz, vx, vy, vz]]) => {
          const where = `frame ${frame} boid ${id}`;

          expect([px, py, pz, vx, vy, vz].every(Number.isFinite), where).toBe(
            true,
          );
          expect(
            seeded.STORAGE_BOUNDARY.containsPoint(position.set(px, py, pz)),
            `${where} left the storage boundary`,
          ).toBe(true);
          expect(
            Math.hypot(vx, vy, vz),
            `${where} exceeded maxSpeed`,
          ).toBeLessThanOrEqual(seeded.BOID_PROPERTIES.maxSpeed + 1e-9);
        });
      });
    });

    it("keeps every boid, and every boid moves", () => {
      const first = actual.frames[String(CHECKPOINTS[0])];
      const last = actual.frames[String(CHECKPOINTS[CHECKPOINTS.length - 1])];

      expect(Object.keys(last)).toHaveLength(actual.meta.boidCount);

      // catches "the simulation stopped stepping", which a stale fixture would
      // otherwise agree with
      const stationary = Object.keys(first).filter((id) => {
        const [ax, ay, az] = first[id];
        const [bx, by, bz] = last[id];

        return Math.hypot(bx - ax, by - ay, bz - az) === 0;
      });

      expect(stationary).toEqual([]);
    });
  });
});
