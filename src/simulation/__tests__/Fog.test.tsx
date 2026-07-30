import * as THREE from "three";
import { expect, it, vi } from "vitest";
import { create } from "@react-three/test-renderer";
import { BACKGROUND_COLOR, fogDensity } from "../../theme";
import Fog from "../Fog";

const WORLD_SIZE = 30;

vi.mock("../../hooks/useWorldSize", () => ({
  default: () => ({ flockSize: 500, worldSize: WORLD_SIZE }),
}));

it("fills the world it was given with fog the colour of the sky behind it", async () => {
  const renderer = await create(<Fog />);

  /* Suspense is transparent to r3f's tree, so this is really asking that `fog`
     attaches to the scene from inside a boundary rather than to nothing */
  const { fog } = renderer.scene.instance as unknown as THREE.Scene;

  /* three's own brand check rather than instanceof: r3f resolves its own copy
     of three, and the two FogExp2 constructors are not the same object */
  expect(
    (fog as THREE.FogExp2)?.isFogExp2,
    "no exponential fog on the scene",
  ).toBe(true);
  expect((fog as THREE.FogExp2).density).toBeCloseTo(
    fogDensity(WORLD_SIZE),
    12,
  );
  // shared with the clear colour, so distance reads as depth rather than as
  // haze laid over the scene
  expect(fog!.color.getHex()).toBe(BACKGROUND_COLOR);
});
