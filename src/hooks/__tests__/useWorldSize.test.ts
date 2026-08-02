import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as config from "../../config";
import useWorldSize from "../useWorldSize";

/**
 * The only place the app decides how much work this machine is asked to do.
 * Both halves of that decision are pinned here: how big a flock a benchmark
 * earns, and the world that holds it at a fixed density: a machine that gets
 * fewer boids has to get a smaller world, or its flock thins out until no boid
 * has a neighbour left to fly with.
 */

const gpu = vi.hoisted(() => ({ result: {} as { fps?: number } }));

vi.mock("@react-three/fiber", () => ({
  useThree: (select: (state: unknown) => unknown) =>
    select({ gl: { getContext: () => ({}) } }),
}));

vi.mock("@react-three/drei", () => ({
  useDetectGPU: () => gpu.result,
}));

function sizeFor(fps: number | undefined) {
  gpu.result = fps === undefined ? {} : { fps };

  return renderHook(() => useWorldSize()).result.current;
}

/** Boids per cubic unit, which is what has to hold still across the range. */
const density = ({
  flockSize,
  worldSize,
}: {
  flockSize: number;
  worldSize: number;
}) => (flockSize * config.FLOCK_COUNT) / worldSize ** 3;

beforeEach(() => {
  gpu.result = {};
});

describe("useWorldSize", () => {
  it("gives a machine that benchmarks at the threshold the whole flock", () => {
    expect(sizeFor(config.FULL_FLOCK_FPS)).toEqual({
      flockSize: config.FLOCK_SIZE,
      worldSize: config.WORLD_SIZE,
    });
  });

  it("gives a machine that benchmarks past the threshold no more than that", () => {
    expect(sizeFor(config.FULL_FLOCK_FPS * 10).flockSize).toBe(
      config.FLOCK_SIZE,
    );
  });

  it("gives a machine with no usable benchmark the smallest flock", () => {
    // detect-gpu reports no fps for a GPU it does not recognise, which Firefox
    // behind resistFingerprinting and every blocklisted card arrive as. Read it
    // as a full score and the weakest machines would earn the largest flock.
    expect(sizeFor(undefined).flockSize).toBe(config.MIN_FLOCK_SIZE);

    // and -1 for a card it benchmarked and then blocklisted, which lands under
    // MIN_FLOCK_SIZE unguarded, since lerp does not clamp
    expect(sizeFor(-1).flockSize).toBe(config.MIN_FLOCK_SIZE);
  });

  it("scales the flock with the benchmark, between the two ends", () => {
    const half = sizeFor(config.FULL_FLOCK_FPS / 2).flockSize;

    expect(half).toBeGreaterThan(config.MIN_FLOCK_SIZE);
    expect(half).toBeLessThan(config.FLOCK_SIZE);
  });

  it("holds the flock at the same density whatever world it gets", () => {
    const across = [undefined, config.FULL_FLOCK_FPS / 4, config.FULL_FLOCK_FPS]
      .map(sizeFor)
      .map(density);

    // scale the world's length with the count rather than its cube root and a
    // machine earning a quarter of the boids gets a sixty-fourth of the space,
    // which is sixteen times the density rather than the same
    across.forEach((value) => expect(value).toBeCloseTo(across[0], 10));
  });
});
