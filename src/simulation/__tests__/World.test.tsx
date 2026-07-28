import * as THREE from "three";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { create, waitFor } from "@react-three/test-renderer";
import SeededWorld from "../../__fixtures__/SeededWorld";
import { GROUP_NAME as HELPER_GROUP_NAME } from "../Helpers";
import { GROUP_NAME as WORLD_GROUP_NAME } from "../World";
import { GROUP_NAME as BOIDS_GROUP_NAME } from "../Boids";
import { FLOCK_SIZE, FLOCK_COUNT } from "../../__fixtures__/seededConfig";

vi.mock("../../hooks/useHelpers", () => ({
  default: vi.fn().mockReturnValue({
    showWorldBoundary: true,
    showStorageBoundary: true,
    showStorageSegmentation: true,
    showMouseTrackingPosition: true,
  }),
}));

beforeEach(() => {
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

  expect(renderer.scene.findAllByType("Group")).toHaveLength(
    2 + FLOCK_SIZE * FLOCK_COUNT, // each Instance has a group
  );
  const worldGroup = renderer.scene.findAllByType("Group")[0];
  expect(worldGroup.instance.name).toEqual(WORLD_GROUP_NAME);

  const helperGroup = renderer.scene.findAllByType("Group")[1];
  expect(helperGroup.instance.name).toEqual(HELPER_GROUP_NAME);
  expect(helperGroup.findAllByType("Box3Helper")).toHaveLength(2);
  expect(helperGroup.findAllByType("Mesh")).toHaveLength(2);

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

it("should have more tests here", { todo: true });
