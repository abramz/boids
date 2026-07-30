import * as THREE from "three";
import Boid from "../../Boid";
import createSimulation, { Simulation } from "../../createSimulation";
import * as seeded from "../../../__fixtures__/seededConfig";
import { FRAME_DELTA } from "./simulate";

/**
 * Frames worth recording. Kept early: this is a chaotic system, so by frame 60
 * the last bit of float difference has amplified into whole units and a
 * comparison can only be exact-or-garbage.
 */
export const CHECKPOINTS = [1, 2, 3, 10] as const;

/**
 * Math.sin/cos/acos are not required by ECMAScript to be correctly rounded, so
 * their last bits differ between V8 builds and CPU architectures. Exact
 * comparison would fail on a machine other than the one that recorded.
 */
export const GOLDEN_TOLERANCE = 1e-9;

export interface GoldenFixture {
  meta: {
    three: string;
    delta: number;
    checkpoints: number[];
    boidCount: number;
  };
  /** state before any step, keyed by compound id */
  initial: Record<string, number[]>;
  /** frame number -> compound id -> [px,py,pz,vx,vy,vz] */
  frames: Record<string, Record<string, number[]>>;
}

function sample(boids: readonly Boid[]): Record<string, number[]> {
  return Object.fromEntries(
    boids.map((boid) => [
      boid.compoundId,
      [...boid.position.toArray(), ...boid.velocity.toArray()],
    ]),
  );
}

export interface GoldenCapture {
  fixture: GoldenFixture;
  /** the run that produced it, so invariants can be checked against its world */
  simulation: Simulation;
}

export function captureGolden(steps = Math.max(...CHECKPOINTS)): GoldenCapture {
  const simulation = createSimulation(seeded.seededWorld());
  const { boids } = simulation;
  const frames: GoldenFixture["frames"] = {};
  const initial = sample(boids);

  for (let frame = 1; frame <= steps; frame++) {
    simulation.step({
      delta: FRAME_DELTA,
      properties: seeded.BOID_PROPERTIES,
      forceFactors: seeded.FORCE_FACTORS,
    });

    if ((CHECKPOINTS as readonly number[]).includes(frame)) {
      frames[String(frame)] = sample(boids);
    }
  }

  return {
    fixture: {
      meta: {
        three: THREE.REVISION,
        delta: FRAME_DELTA,
        checkpoints: [...CHECKPOINTS],
        boidCount: boids.length,
      },
      initial,
      frames,
    },
    simulation,
  };
}

export interface Divergence {
  where: string;
  expected: number;
  actual: number;
  absolute: number;
}

/** Boids on one side of a comparison and not the other. */
export interface IdMismatch {
  /** recorded, but not produced by the run */
  missing: string[];
  /** produced by the run, but never recorded */
  extra: string[];
}

/**
 * Which boids the two sides disagree about the existence of.
 *
 * `compare` walks the recorded ids, so on its own it cannot see a boid the run
 * grew that the fixture has never heard of.
 */
export function idMismatch(
  expected: Record<string, number[]>,
  actual: Record<string, number[]>,
): IdMismatch {
  return {
    missing: Object.keys(expected).filter((id) => !(id in actual)),
    extra: Object.keys(actual).filter((id) => !(id in expected)),
  };
}

/** Divergences beyond `tolerance`, located and measured. */
export function compare(
  expected: Record<string, number[]>,
  actual: Record<string, number[]>,
  label: string,
  tolerance = GOLDEN_TOLERANCE,
): Divergence[] {
  const divergences: Divergence[] = [];
  const fields = ["px", "py", "pz", "vx", "vy", "vz"];

  Object.entries(expected).forEach(([id, values]) => {
    const other = actual[id];
    if (!other) {
      return; // idMismatch reports these; there is nothing here to measure
    }

    values.forEach((value, index) => {
      const absolute = Math.abs(value - other[index]);
      if (absolute > tolerance) {
        divergences.push({
          where: `${label} ${id}.${fields[index]}`,
          expected: value,
          actual: other[index],
          absolute,
        });
      }
    });
  });

  return divergences;
}

export function describeDivergences(divergences: Divergence[]): string {
  if (divergences.length === 0) {
    return "no divergence";
  }

  const worst = divergences.reduce((a, b) => (b.absolute > a.absolute ? b : a));
  const first = divergences[0];

  return [
    `${divergences.length} value(s) diverged`,
    `  first:       ${first.where} expected ${first.expected} got ${first.actual}`,
    `  max absolute ${worst.absolute.toExponential(3)} at ${worst.where}`,
  ].join("\n");
}
