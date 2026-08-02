import * as THREE from "three";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { create, waitFor } from "@react-three/test-renderer";
import { clear, peek } from "suspend-react";
import SeededWorld from "../../__fixtures__/SeededWorld";
import {
  FLOCK_COUNT,
  FLOCK_SIZE,
  WORLD_SIZE,
} from "../../__fixtures__/seededConfig";
import { Simulation } from "../../behavior/createSimulation";
import { simulationCacheKey } from "../../hooks/useBoidSimulation";
import { FRAME_DELTA } from "../../behavior/__tests__/helpers/simulate";
import { GROUP_NAME as BOIDS_GROUP_NAME } from "../Boids";

const BOID_COUNT = FLOCK_SIZE * FLOCK_COUNT;

const FLOAT32_SLOP = 1e-5;

beforeEach(() => {
  clear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

it("draws each boid where the simulation put it, and keeps up as it moves", async () => {
  const renderer = await create(<SeededWorld />);
  await waitFor(() => {
    vi.runAllTimers();
  });

  const simulation = peek(
    simulationCacheKey({
      flockSize: FLOCK_SIZE,
      flockCount: FLOCK_COUNT,
      worldSize: WORLD_SIZE,
    }),
  ) as Simulation;
  expect(simulation, "the render did not build a simulation").toBeTruthy();

  const boidsMesh = renderer.scene
    .findAllByType("Mesh")
    .find((candidate) => candidate.instance.name === BOIDS_GROUP_NAME);

  expect(boidsMesh, `no mesh named ${BOIDS_GROUP_NAME}`).toBeTruthy();
  const mesh = boidsMesh!.instance as unknown as THREE.InstancedMesh;
  expect(mesh.instanceMatrix.count).toEqual(BOID_COUNT);

  const matrix = new THREE.Matrix4();
  const drawn = new THREE.Vector3();
  const drawnPositions = () =>
    Array.from({ length: BOID_COUNT }, (_, index) => {
      mesh.getMatrixAt(index, matrix);

      return drawn.setFromMatrixPosition(matrix).clone();
    });

  for (let frame = 0; frame < 4; frame++) {
    await renderer.advanceFrames(1, FRAME_DELTA);
  }
  const before = drawnPositions();

  const wereAt = simulation.boids.map((boid) => boid.position.clone());
  await renderer.advanceFrames(1, FRAME_DELTA);
  const after = drawnPositions();

  after.forEach((position, index) => {
    expect(position.distanceTo(wereAt[index]), `boid ${index}`).toBeLessThan(
      FLOAT32_SLOP,
    );
  });

  expect(after.some((position, index) => !position.equals(before[index]))).toBe(
    true,
  );
});
