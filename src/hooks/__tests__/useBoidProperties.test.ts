import { act, renderHook } from "@testing-library/react";
import { expect, it } from "vitest";
import { levaStore } from "leva";
import { BoidProperties } from "../../behavior/Boid";
import useBoidProperties from "../useBoidProperties";

const WORLD_SIZE = 50;

const PROPERTIES: BoidProperties = {
  perceptionRadius: 3,
  fieldOfViewDeg: 230,
  desiredSeparation: 1,
  neighbourLimit: 8,
  minSpeed: 4,
  maxSpeed: 8,
  maxForce: 24,
  boidSize: 0.2,
};

function drag(control: string, to: number): void {
  act(() => levaStore.setValueAtPath(`Boid Properties.${control}`, to, true));
}

it("never leaves the floor on a boid's speed above the ceiling", () => {
  /* leva has no way to bound one control by another, and three's clamp resolves
     an inverted range to its lower bound, so maxSpeed would stop meaning
     anything at all */
  const { result } = renderHook(() =>
    useBoidProperties(WORLD_SIZE, PROPERTIES),
  );

  drag("maxSpeed", 2);

  expect(result.current.maxSpeed).toBe(2);
  expect(result.current.minSpeed).toBe(2);
});

it("keeps the sliders inside the world this machine was given", () => {
  const { result } = renderHook(() =>
    useBoidProperties(WORLD_SIZE, PROPERTIES),
  );

  drag("perceptionRadius", WORLD_SIZE * 10);

  expect(result.current.perceptionRadius).toBe(WORLD_SIZE);
});
