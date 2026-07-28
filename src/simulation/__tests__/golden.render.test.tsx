import * as THREE from "three";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { create, waitFor } from "@react-three/test-renderer";
import SeededWorld from "../../__mocks__/SeededWorld";
import { FLOCK_COUNT, FLOCK_SIZE } from "../../__mocks__/seededConfig";
import { GROUP_NAME as BOIDS_GROUP_NAME } from "../Boids";
import { GOLDEN_DELTA } from "../../behavior/__tests__/helpers/golden";

/**
 * Asserts the rendered instance matrices against the boids the simulation
 * produced, so a divergence between the two is attributable to React, r3f or
 * drei rather than to the maths.
 *
 * One `create(<SeededWorld/>)` in this file, and it has to stay that way:
 * src/helpers/suspend.ts caches into a module-level singleton, so a second
 * render would silently be handed the first one's already-advanced store.
 */

const BOID_COUNT = FLOCK_SIZE * FLOCK_COUNT;

beforeEach(() => {
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

  // drei's Instances writes matrices a frame behind the positions it reads, and
  // simulation/Boid.tsx syncs only half the boids per frame by id parity, so
  // every boid needs a few frames to have been written at least once
  await renderer.advanceFrames(8, GOLDEN_DELTA);

  const scene = renderer.scene.findAllByType("Group");
  const simulated = scene
    .map((node) => node.instance)
    .filter((instance) => instance.name.startsWith("Boid-"));
  expect(simulated).toHaveLength(BOID_COUNT);

  const before = drawnPositions();
  before.forEach((position, index) => {
    expect(position.distanceTo(simulated[index].position)).toBeLessThan(1e-6);
  });

  // and the rendered transforms keep tracking as the simulation advances
  await renderer.advanceFrames(8, GOLDEN_DELTA);
  const after = drawnPositions();

  expect(after.some((position, i) => !position.equals(before[i]))).toBe(true);
  after.forEach((position, index) => {
    expect(position.distanceTo(simulated[index].position)).toBeLessThan(1e-6);
  });
});
