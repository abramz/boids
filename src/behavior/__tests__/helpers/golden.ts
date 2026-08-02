import * as THREE from "three";
import Boid from "../../Boid";
import createSimulation from "../../createSimulation";
import * as seeded from "../../../__fixtures__/seededConfig";
import { FRAME_DELTA } from "./simulate";

export const CHECKPOINTS = [1, 2, 3, 10] as const;

export const GOLDEN_TOLERANCE = 1e-9;

export interface GoldenFixture {
  meta: {
    three: string;
    delta: number;
    checkpoints: number[];
    boidCount: number;
  };
  initial: Record<string, number[]>;
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

export function captureGolden(steps = Math.max(...CHECKPOINTS)): GoldenFixture {
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
    meta: {
      three: THREE.REVISION,
      delta: FRAME_DELTA,
      checkpoints: [...CHECKPOINTS],
      boidCount: boids.length,
    },
    initial,
    frames,
  };
}

export interface Divergence {
  where: string;
  expected: number;
  actual: number;
  absolute: number;
}

export interface IdMismatch {
  missing: string[];
  extra: string[];
}

export function idMismatch(
  expected: Record<string, number[]>,
  actual: Record<string, number[]>,
): IdMismatch {
  return {
    missing: Object.keys(expected).filter((id) => !(id in actual)),
    extra: Object.keys(actual).filter((id) => !(id in expected)),
  };
}

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
      return;
    }

    values.forEach((value, index) => {
      const absolute = Math.abs(value - other[index]);
      if (!(absolute <= tolerance)) {
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
