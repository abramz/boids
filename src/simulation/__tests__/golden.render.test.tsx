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

/**
 * Asserts the rendered instance matrices against the boids the simulation
 * produced, so a divergence between the two is attributable to React, r3f or
 * drei rather than to the maths.
 */

const BOID_COUNT = FLOCK_SIZE * FLOCK_COUNT;

/**
 * An instance matrix is a Float32Array, so a position round-trips through
 * single precision. Orders below the 0.08 units a boid covers in a frame,
 * which is the difference these assertions are actually drawing.
 */
const FLOAT32_SLOP = 1e-5;

beforeEach(() => {
  /* the built flock is cached under its world's shape, so without this a
     second render in this file is handed the first one's advanced simulation */
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

  /* the same cache the render built it in, so these are the boids on screen
     rather than a second simulation that merely started the same way */
  const simulation = peek(
    simulationCacheKey({
      flockSize: FLOCK_SIZE,
      flockCount: FLOCK_COUNT,
      worldSize: WORLD_SIZE,
    }),
  ) as Simulation;
  expect(simulation, "the render did not build a simulation").toBeTruthy();

  // the scene also holds boundary helpers and obstacle meshes
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

  // let every instance be written at least once before measuring
  for (let frame = 0; frame < 4; frame++) {
    await renderer.advanceFrames(1, FRAME_DELTA);
  }
  const before = drawnPositions();

  /* the simulation steps after the render layer has read it, so a frame draws
     the flock as it stood when the frame began - which is exactly what the
     next frame's matrices have to hold */
  const wereAt = simulation.boids.map((boid) => boid.position.clone());
  await renderer.advanceFrames(1, FRAME_DELTA);
  const after = drawnPositions();

  after.forEach((position, index) => {
    expect(position.distanceTo(wereAt[index]), `boid ${index}`).toBeLessThan(
      FLOAT32_SLOP,
    );
  });

  // and they are tracking rather than stuck on whatever the layout effect wrote
  expect(after.some((position, index) => !position.equals(before[index]))).toBe(
    true,
  );
});
