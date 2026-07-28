import * as THREE from "three";
import Boid from "../../Boid";
import deriveBoidProperties from "../../deriveBoidProperties";
import initialize from "../../initialize";
import stepSimulation from "../../step";
import * as seeded from "../../../__fixtures__/seededConfig";

export const GOLDEN_DELTA = 1 / 60;

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

function sample(boids: Boid[]): Record<string, number[]> {
  return Object.fromEntries(
    boids.map((boid) => [
      boid.coumpundId,
      [...boid.position.toArray(), ...boid.velocity.toArray()],
    ]),
  );
}

/**
 * `initialize` is called directly rather than through `src/helpers/suspend.ts`,
 * which caches into a module-level singleton and would hand back an
 * already-advanced store.
 */
export async function captureGolden(
  steps = Math.max(...CHECKPOINTS),
): Promise<GoldenFixture> {
  const storage = await initialize(
    seeded.FLOCK_SIZE,
    seeded.FLOCK_COUNT,
    seeded.BOID_PROPERTIES.maxSpeed,
    seeded.WORLD_BOUNDARY,
    seeded.STORAGE_BOUNDARY,
    seeded.SEED_X,
    seeded.SEED_Y,
    seeded.SEED_Z,
    seeded.SEED_PHI,
    seeded.SEED_THETA,
    seeded.SEED_STORAGE_START,
  );

  const boids = storage.boids;
  const properties = deriveBoidProperties(seeded.BOID_PROPERTIES);
  const frames: GoldenFixture["frames"] = {};
  const initial = sample(boids);

  let frameSign = 1;
  for (let frame = 1; frame <= steps; frame++) {
    frameSign = stepSimulation({
      storage,
      boids,
      frameSign,
      delta: GOLDEN_DELTA,
      properties,
      forceFactors: seeded.FORCE_FACTORS,
      worldBoundary: seeded.WORLD_BOUNDARY,
    });

    if ((CHECKPOINTS as readonly number[]).includes(frame)) {
      frames[String(frame)] = sample(boids);
    }
  }

  return {
    meta: {
      three: THREE.REVISION,
      delta: GOLDEN_DELTA,
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
