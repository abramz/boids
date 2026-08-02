import * as THREE from "three";
import { expect, it, vi } from "vitest";
import { create } from "@react-three/test-renderer";
import { SUN_POSITION, shadowFrustum } from "../../theme";
import Sun, { GROUP_NAME } from "../Sun";

const WORLD_SIZE = 30;

vi.mock("../../hooks/useWorldSize", () => ({
  default: () => ({ flockSize: 500, worldSize: WORLD_SIZE }),
}));

async function renderSun() {
  const renderer = await create(<Sun />);

  const light = renderer.scene
    .findAllByType("DirectionalLight")
    .map((node) => node.instance as unknown as THREE.DirectionalLight)
    .find((node) => node.castShadow);
  const disc = renderer.scene
    .findAllByType("Group")
    .find((node) => node.instance.name === GROUP_NAME);

  return { light, disc: disc?.instance as THREE.Object3D | undefined };
}

it("casts through a frustum sized to the world it was given", async () => {
  const { light } = await renderSun();
  expect(light, "no shadow-casting light").toBeTruthy();

  /* three reads the shadow camera's projection as it stands, so a frustum left
     at three's defaults brackets a couple of units around the origin and
     nothing in the world casts at all */
  const { extent, near, far } = shadowFrustum(WORLD_SIZE);
  const camera = light!.shadow.camera;

  expect([camera.left, camera.right, camera.bottom, camera.top]).toEqual([
    -extent,
    extent,
    -extent,
    extent,
  ]);
  expect(camera.near).toBeCloseTo(near, 12);
  expect(camera.far).toBeCloseTo(far, 12);
});

it("throws the key light from where the sun is drawn", async () => {
  const { light, disc } = await renderSun();
  expect(disc, "nothing drawn for the sun itself").toBeTruthy();

  // the light and the disc are one thing to a viewer, so a lit face has to
  // agree with where the sun appears to be
  expect(light!.position.toArray()).toEqual(disc!.position.toArray());
  expect(light!.position.toArray()).toEqual(SUN_POSITION);
});
