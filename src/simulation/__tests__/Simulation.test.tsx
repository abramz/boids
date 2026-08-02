import * as THREE from "three";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, create, waitFor } from "@react-three/test-renderer";
import { useThree } from "@react-three/fiber";
import { clear } from "suspend-react";
import { AlertContext } from "../../hooks/alertContext";
import useHelpers from "../../hooks/useHelpers";
import useWorldSize from "../../hooks/useWorldSize";
import Simulation from "../Simulation";
import { GROUP_NAME as WORLD_GROUP_NAME } from "../World";
import { GROUP_NAME as SUN_GROUP_NAME } from "../Sun";

vi.mock("../../hooks/useHelpers", () => ({ default: vi.fn() }));
vi.mock("../../hooks/useWorldSize", () => ({ default: vi.fn() }));

beforeEach(() => {
  /* the built flock is cached under its world's shape, so without this a second
     render is handed the first one's advanced simulation */
  clear();
  vi.useFakeTimers();
  vi.mocked(useHelpers).mockReturnValue({
    showWorldBoundary: false,
    showStorageCells: false,
  });
  vi.mocked(useWorldSize).mockReturnValue({ flockSize: 4, worldSize: 20 });
});

afterEach(() => {
  vi.useRealTimers();
  setVisibility("visible");
});

function setVisibility(state: DocumentVisibilityState): void {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

let clock: THREE.Clock | undefined;

function ClockProbe(): null {
  clock = useThree((state) => state.clock);

  return null;
}

async function renderScene() {
  const renderer = await create(
    <AlertContext.Provider value={{ setAlertContents: vi.fn() }}>
      <Simulation />
      <ClockProbe />
    </AlertContext.Provider>,
  );

  await waitFor(() => {
    vi.runAllTimers();
  });

  return renderer;
}

/**
 * Every piece of the scene has a test of its own; this is the one that says
 * they are mounted. Each absence is a scene-wide effect - no fog, no key light,
 * a camera that cannot be moved, a backgrounded tab integrating a minute in one
 * frame - which renders as a scene that merely looks different.
 */
it("should compose the whole scene, not just the world in it", async () => {
  const renderer = await renderScene();
  const scene = renderer.scene.instance as unknown as THREE.Scene;
  const mounted = (constructor: string) =>
    renderer.scene.findAll(
      (node) => node.instance?.constructor?.name === constructor,
    );
  const named = (name: string) =>
    renderer.scene.findAll((node) => node.instance.name === name);

  expect(named(WORLD_GROUP_NAME), "the flock and its world").toHaveLength(1);
  expect(named(SUN_GROUP_NAME), "the sun the scene is lit from").toHaveLength(
    1,
  );
  expect((scene.fog as THREE.FogExp2)?.isFogExp2, "fog").toBe(true);
  expect(mounted("OrbitControls"), "a camera the viewer can move").toHaveLength(
    1,
  );
  expect(mounted("AmbientLight"), "fill light").toHaveLength(1);
});

it("should stop the simulation clock when the tab goes away", async () => {
  await renderScene();
  expect(clock?.running, "no clock reached the scene").toBe(true);

  await act(async () => setVisibility("hidden"));

  expect(clock?.running).toBe(false);
});
