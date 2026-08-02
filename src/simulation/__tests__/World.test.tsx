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

/** What useWorldSize hands back for the machine the camera test runs on. */
const MACHINE_WORLD = { flockSize: 8, worldSize: 20 };

beforeEach(() => {
  /* the built flock is cached under its world's shape, so without this the
     second render in this file is handed the first one's advanced simulation */
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

it("should draw the obstacles the flock has to steer around", async () => {
  const renderer = await render(<SeededWorld />);

  const obstacles = renderer.scene
    .findAllByType("Group")
    .find((group) => group.instance.name === OBSTACLE_GROUP_NAME);

  expect(obstacles, OBSTACLE_GROUP_NAME).toBeTruthy();
});

it("should draw the world boundary around the world the flock was built in", async () => {
  const renderer = await render(<SeededWorld />);

  const [world] = renderer.scene
    .findAllByType("Box3Helper")
    .map((helper) => (helper.instance as unknown as THREE.Box3Helper).box);

  /* the only box left to draw: the index reaches everywhere and has no
     boundary of its own, so what a boid steers to stay inside is the one
     thing there is to see */
  const half = WORLD_SIZE / 2;
  expect(world.min.toArray()).toEqual([-half, -half, -half]);
  expect(world.max.toArray()).toEqual([half, half, half]);
});

it("should show each debug helper only while its own toggle is on", async () => {
  /* one at a time, or the two toggles are interchangeable: crossed over, the
     world boundary switch draws the storage cells and the other way about */
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

it("should stand the camera off far enough to see the world it was given", async () => {
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

  /* inside the world the flock fills the frame and the far side of it is
     behind the near, which is the whole scene lost */
  expect(camera?.position.z).toBeGreaterThan(MACHINE_WORLD.worldSize / 2);
});
