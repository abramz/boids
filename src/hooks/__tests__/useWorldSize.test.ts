import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as config from "../../config";
import useWorldSize from "../useWorldSize";

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
    expect(sizeFor(undefined).flockSize).toBe(config.MIN_FLOCK_SIZE);

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

    across.forEach((value) => expect(value).toBeCloseTo(across[0], 10));
  });
});
