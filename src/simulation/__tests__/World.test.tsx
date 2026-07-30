import * as THREE from "three";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { create, waitFor } from "@react-three/test-renderer";
import { clear } from "suspend-react";
import SeededWorld from "../../__fixtures__/SeededWorld";
import { GROUP_NAME as HELPER_GROUP_NAME } from "../Helpers";
import { GROUP_NAME as WORLD_GROUP_NAME } from "../World";
import { GROUP_NAME as BOIDS_GROUP_NAME } from "../Boids";
import { GROUP_NAME as OBSTACLE_GROUP_NAME } from "../../obstacle/ObstacleDisplay";
import { FLOCK_SIZE, FLOCK_COUNT } from "../../__fixtures__/seededConfig";

vi.mock("../../hooks/useHelpers", () => ({
  default: vi.fn().mockReturnValue({
    showWorldBoundary: true,
    showStorageBoundary: true,
    showStorageSegmentation: true,
  }),
}));

beforeEach(() => {
  /* the built flock is cached under its world's shape, so without this the
     second render in this file is handed the first one's advanced simulation */
  clear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

async function render(): ReturnType<typeof create> {
  const renderer = await create(<SeededWorld />);

  await waitFor(() => {
    vi.runAllTimers();
  });

  return renderer;
}

it("should render the world in all of its glory", async () => {
  const renderer = await render();

  const groups = renderer.scene.findAllByType("Group");
  const named = (name: string) =>
    groups.find((group) => group.instance.name === name);

  expect(named(WORLD_GROUP_NAME), WORLD_GROUP_NAME).toBeTruthy();
  expect(named(OBSTACLE_GROUP_NAME), OBSTACLE_GROUP_NAME).toBeTruthy();

  const helperGroup = named(HELPER_GROUP_NAME);
  expect(helperGroup, HELPER_GROUP_NAME).toBeTruthy();
  expect(helperGroup!.findAllByType("Box3Helper")).toHaveLength(2);
  expect(helperGroup!.findAllByType("Mesh")).toHaveLength(1);

  const meshes = renderer.scene.findAllByType("Mesh");
  const boidsMesh = meshes.find((m) => m.instance.name === BOIDS_GROUP_NAME);
  expect(boidsMesh).toBeTruthy();

  // drei 10 renders Instances as the InstancedMesh itself rather than wrapping
  // it in a container, so the named node IS the mesh and has no Mesh children.
  // Assert on the instancing instead, which is what actually matters here.
  expect(boidsMesh!.findAllByType("Mesh")).toHaveLength(0);
  expect(
    (boidsMesh!.instance as unknown as THREE.InstancedMesh).instanceMatrix
      .count,
  ).toEqual(FLOCK_SIZE * FLOCK_COUNT);
});

it("should draw the storage boundary reaching out past the world it holds", async () => {
  const renderer = await render();

  const [world, storage] = renderer.scene
    .findAllByType("Box3Helper")
    .map((helper) => (helper.instance as unknown as THREE.Box3Helper).box);

  // a boid overshoots the world before edge avoidance turns it, and the index
  // has to still cover it where it got to
  expect(storage.containsBox(world)).toBe(true);
  expect(storage.min.x).toBeLessThan(world.min.x);
  expect(storage.max.x).toBeGreaterThan(world.max.x);
});
