import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { create, waitFor } from "@react-three/test-renderer";
import SeededWorld from "../../__mocks__/SeededWorld";
import { GROUP_NAME as HELPER_GROUP_NAME } from "../Helpers";
import { GROUP_NAME as BOIDS_GROUP_NAME } from "../Boids";
import { GROUP_NAME as WORLD_GROUP_NAME } from "../World";

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

  expect(renderer.scene.findAllByType("Group")).toHaveLength(3);
  const worldGroup = renderer.scene.findAllByType("Group")[0];
  expect(worldGroup.instance.name).toEqual(WORLD_GROUP_NAME);

  const helperGroup = renderer.scene.findAllByType("Group")[1];
  expect(helperGroup.instance.name).toEqual(HELPER_GROUP_NAME);
  expect(helperGroup.findAllByType("Box3Helper")).toHaveLength(2);
  expect(helperGroup.findAllByType("Mesh")).toHaveLength(2);

  const boidsGroup = renderer.scene.findAllByType("Group")[2];
  expect(boidsGroup.instance.name).toEqual(BOIDS_GROUP_NAME);
  expect(boidsGroup.findAllByType("Mesh")).toHaveLength(1);
});

it("should have more tests here", { todo: true });
