import * as THREE from "three";
import { expect, it } from "vitest";
import { create } from "@react-three/test-renderer";
import Obstacle from "../Obstacle";
import ObstacleDisplay, { GROUP_NAME } from "../ObstacleDisplay";

const OBSTACLES = [
  new Obstacle(new THREE.Vector3(3, 0, 0), 1),
  new Obstacle(new THREE.Vector3(-3, 4, 5), 1),
];

const tempMatrix = new THREE.Matrix4();
const tempPosition = new THREE.Vector3();
const tempQuaternion = new THREE.Quaternion();
const tempScale = new THREE.Vector3();

function instanceAt(mesh: THREE.InstancedMesh, index: number) {
  mesh.getMatrixAt(index, tempMatrix);
  tempMatrix.decompose(tempPosition, tempQuaternion, tempScale);

  return {
    position: tempPosition.toArray(),
    turned: Math.abs(tempQuaternion.w) < 1 - 1e-9,
  };
}

async function render(obstacles: readonly Obstacle[] = OBSTACLES) {
  const renderer = await create(<ObstacleDisplay obstacles={obstacles} />);
  await renderer.advanceFrames(2, 0.01);

  const meshes = renderer.scene
    .findAllByType("Mesh")
    .map((node) => node.instance as unknown as THREE.InstancedMesh);
  const withMaterial = (type: string) =>
    meshes.find((mesh) => (mesh.material as THREE.Material).type === type);

  return {
    renderer,
    core: withMaterial("MeshStandardMaterial"),
    rim: withMaterial("MeshBasicMaterial"),
  };
}

it("draws a body and a rim on every obstacle, where the obstacle is", async () => {
  const { core, rim } = await render();
  expect(core, "no lit body").toBeTruthy();
  expect(rim, "no rim shell").toBeTruthy();

  OBSTACLES.forEach((obstacle, index) => {
    const where = obstacle.position.toArray();

    expect(instanceAt(core!, index).position).toEqual(where);
    expect(instanceAt(rim!, index).position).toEqual(where);
  });
});

it("turns each body on its own, and leaves the rim still", async () => {
  const { core, rim } = await render();

  expect(instanceAt(core!, 0).turned).toBe(true);
  expect(instanceAt(rim!, 0).turned).toBe(false);
});

it("casts the only shadows in the scene from the body", async () => {
  const { core, rim } = await render();

  expect(core!.castShadow).toBe(true);
  expect(core!.receiveShadow).toBe(true);
  expect(rim!.castShadow).toBe(false);
});

it("draws nothing at all for a world with no obstacles", async () => {
  const { renderer } = await render([]);

  expect(
    renderer.scene
      .findAllByType("Group")
      .find((node) => node.instance.name === GROUP_NAME),
  ).toBeUndefined();
});
