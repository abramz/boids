import * as THREE from "three";
import { expect, it, vi } from "vitest";
import { create } from "@react-three/test-renderer";
import { BACKGROUND_COLOR, fogDensity } from "../../theme";
import Fog from "../Fog";

const WORLD_SIZE = 30;

vi.mock("../../hooks/useWorldSize", () => ({
  default: () => ({ flockSize: 500, worldSize: WORLD_SIZE }),
}));

it("fills the world it was given with fog the color of the sky behind it", async () => {
  const renderer = await create(<Fog />);

  const { fog } = renderer.scene.instance as unknown as THREE.Scene;

  expect(
    (fog as THREE.FogExp2)?.isFogExp2,
    "no exponential fog on the scene",
  ).toBe(true);
  expect((fog as THREE.FogExp2).density).toBeCloseTo(
    fogDensity(WORLD_SIZE),
    12,
  );
  expect(fog!.color.getHex()).toBe(BACKGROUND_COLOR);
});
