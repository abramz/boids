import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import * as seeded from "../../__fixtures__/seededConfig";
import {
  CHECKPOINTS,
  GoldenFixture,
  captureGolden,
  compare,
  describeDivergences,
  idMismatch,
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

/* only the documented value re-records, so UPDATE_GOLDEN=0 does what it says */
const RE_RECORD = process.env.UPDATE_GOLDEN === "1";

const NO_ID_MISMATCH = { missing: [], extra: [] };

describe("golden simulation", () => {
  let actual: GoldenFixture;

  beforeAll(() => {
    actual = captureGolden();
  });

  it("matches the recorded trajectory", () => {
    if (RE_RECORD) {
      writeFileSync(FIXTURE, `${JSON.stringify(actual, null, 2)}\n`);
      expect.fail(
        `golden re-recorded against three r${actual.meta.three}; re-run without UPDATE_GOLDEN`,
      );
    }

    const expected: GoldenFixture = JSON.parse(readFileSync(FIXTURE, "utf8"));

    // the fixture's own count, not the run's: a flock that grew or shrank makes
    // every comparison below an argument about a different simulation
    expect(actual.meta.boidCount, "flock size changed").toBe(
      expected.meta.boidCount,
    );

    // if three's seeded RNG or setFromSpherical moved, every boid starts
    // somewhere else and the per-frame comparison below is noise
    expect(
      idMismatch(expected.initial, actual.initial),
      "the recorded boids and the simulated boids are not the same set",
    ).toEqual(NO_ID_MISMATCH);

    const drifted = compare(expected.initial, actual.initial, "initial");
    expect(
      drifted,
      `initial conditions changed - recorded against three r${expected.meta.three}, running r${actual.meta.three}\n` +
        describeDivergences(drifted),
    ).toEqual([]);

    CHECKPOINTS.forEach((frame) => {
      const recorded = expected.frames[String(frame)];
      const captured = actual.frames[String(frame)];

      expect(
        idMismatch(recorded, captured),
        `frame ${frame} holds a different set of boids`,
      ).toEqual(NO_ID_MISMATCH);

      const divergences = compare(recorded, captured, `frame ${frame}`);

      expect(divergences, describeDivergences(divergences)).toEqual([]);
    });
  });

  it("is reproducible across runs", () => {
    const first = captureGolden(10);
    const second = captureGolden(10);

    /* the layer steps every boid through module-level scratch - the temp
       vectors, the neighbour buffers, the index's typed arrays - so a run that
       leaves any of it dirty shows up here and nowhere else */
    expect(second.frames["10"]).toEqual(first.frames["10"]);
  });

  /* asserted against the capture rather than the fixture, so they hold through
     a re-record: the fixture says the trajectory moved, this says it broke */
  it("stays finite and within the speed limit", () => {
    Object.entries(actual.frames).forEach(([frame, boids]) => {
      Object.entries(boids).forEach(([id, [px, py, pz, vx, vy, vz]]) => {
        const where = `frame ${frame} boid ${id}`;

        expect([px, py, pz, vx, vy, vz].every(Number.isFinite), where).toBe(
          true,
        );
        expect(
          Math.hypot(vx, vy, vz),
          `${where} exceeded maxSpeed`,
        ).toBeLessThanOrEqual(seeded.BOID_PROPERTIES.maxSpeed + 1e-9);
      });
    });
  });
});
