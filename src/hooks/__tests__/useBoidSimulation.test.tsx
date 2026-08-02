import { beforeEach, expect, it } from "vitest";
import ReactThreeTestRenderer from "@react-three/test-renderer";
import { clear, peek } from "suspend-react";
import SeededWorld from "../../__fixtures__/SeededWorld";
import {
  FLOCK_COUNT,
  FLOCK_SIZE,
  WORLD_SIZE,
} from "../../__fixtures__/seededConfig";
import { Simulation } from "../../behavior/createSimulation";
import { simulationCacheKey } from "../useBoidSimulation";

const KEY = simulationCacheKey({
  flockSize: FLOCK_SIZE,
  flockCount: FLOCK_COUNT,
  worldSize: WORLD_SIZE,
});

const built = () => peek(KEY) as Simulation | undefined;

beforeEach(() => {
  clear();
});

it("drops the simulation it built when the world unmounts", async () => {
  const renderer = await ReactThreeTestRenderer.create(<SeededWorld />);
  expect(built()).toBeTruthy();

  await renderer.unmount();

  expect(built()).toBeUndefined();
});

it("builds a new simulation for a world mounted after an earlier one died", async () => {
  const first = await ReactThreeTestRenderer.create(<SeededWorld />);
  const before = built();
  await first.unmount();

  const second = await ReactThreeTestRenderer.create(<SeededWorld />);
  const after = built();

  expect(after).toBeTruthy();
  expect(after).not.toBe(before);

  await second.unmount();
});

it("advances the flock a frame at a time while it is mounted", async () => {
  const renderer = await ReactThreeTestRenderer.create(<SeededWorld />);
  const simulation = built()!;
  const start = simulation.boids[0].position.clone();

  await renderer.advanceFrames(4, 1 / 60);

  expect(simulation.boids[0].position.equals(start)).toBe(false);

  await renderer.unmount();
});
