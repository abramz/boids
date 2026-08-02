import * as THREE from "three";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { create, waitFor } from "@react-three/test-renderer";
import { useThree } from "@react-three/fiber";
import { clear } from "suspend-react";
import SeededWorld from "../../__fixtures__/SeededWorld";
import useHelpers from "../../hooks/useHelpers";
import useWorldSize from "../../hooks/useWorldSize";
import { GROUP_NAME as HELPER_GROUP_NAME } from "../Helpers";
import { GROUP_NAME as STORAGE_GROUP_NAME } from "../helpers/StorageVisualizer";
import { GROUP_NAME as OBSTACLE_GROUP_NAME } from "../../obstacle/ObstacleDisplay";
import World from "../World";
import { WORLD_SIZE } from "../../__fixtures__/seededConfig";

vi.mock("../../hooks/useHelpers", () => ({ default: vi.fn() }));
vi.mock("../../hooks/useWorldSize", () => ({ default: vi.fn() }));

const showAllHelpers = { showWorldBoundary: true, showStorageCells: true };

const MACHINE_WORLD = { flockSize: 8, worldSize: 20 };

beforeEach(() => {
  clear();
  vi.useFakeTimers();
  vi.mocked(useHelpers).mockReturnValue(showAllHelpers);
  vi.mocked(useWorldSize).mockReturnValue(MACHINE_WORLD);
});

afterEach(() => {
  vi.useRealTimers();
});

async function render(element: React.ReactElement): ReturnType<typeof create> {
  const renderer = await create(element);

  await waitFor(() => {
    vi.runAllTimers();
  });

  return renderer;
}

it("draws the obstacles the flock has to steer around", async () => {
  const renderer = await render(<SeededWorld />);

  const obstacles = renderer.scene
    .findAllByType("Group")
    .find((group) => group.instance.name === OBSTACLE_GROUP_NAME);

  expect(obstacles, OBSTACLE_GROUP_NAME).toBeTruthy();
});

it("draws the world boundary around the world the flock was built in", async () => {
  const renderer = await render(<SeededWorld />);

  const [world] = renderer.scene
    .findAllByType("Box3Helper")
    .map((helper) => (helper.instance as unknown as THREE.Box3Helper).box);

  const half = WORLD_SIZE / 2;
  expect(world.min.toArray()).toEqual([-half, -half, -half]);
  expect(world.max.toArray()).toEqual([half, half, half]);
});

it("shows each debug helper only while its own toggle is on", async () => {
  const helpersIn = (renderer: Awaited<ReturnType<typeof create>>) => {
    const group = renderer.scene
      .findAllByType("Group")
      .find((node) => node.instance.name === HELPER_GROUP_NAME);
    const cells = group
      ?.findAllByType("Mesh")
      .find((node) => node.instance.name === STORAGE_GROUP_NAME);

    return {
      boundary: group?.findAllByType("Box3Helper")[0]
        .instance as THREE.Object3D,
      cells: cells?.instance as THREE.Object3D,
    };
  };

  vi.mocked(useHelpers).mockReturnValue({
    showWorldBoundary: true,
    showStorageCells: false,
  });
  const boundaryOnly = helpersIn(await render(<SeededWorld />));
  expect(boundaryOnly.boundary.visible).toBe(true);
  expect(boundaryOnly.cells.visible).toBe(false);

  clear();
  vi.mocked(useHelpers).mockReturnValue({
    showWorldBoundary: false,
    showStorageCells: true,
  });

  const cellsOnly = helpersIn(await render(<SeededWorld />));
  expect(cellsOnly.boundary.visible).toBe(false);
  expect(cellsOnly.cells.visible).toBe(true);
});

it("stands the camera off far enough to see the world it was given", async () => {
  let camera: THREE.Camera | undefined;

  function CameraProbe(): null {
    camera = useThree((state) => state.camera);

    return null;
  }

  await render(
    <>
      <World />
      <CameraProbe />
    </>,
  );

  expect(camera?.position.z).toBeGreaterThan(MACHINE_WORLD.worldSize / 2);
});
