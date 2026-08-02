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

/**
 * The core is the lit body and the rim is the additive shell around it, told
 * apart by their materials rather than by the order they are declared in.
 */
async function render(obstacles: readonly Obstacle[] = OBSTACLES) {
  const renderer = await create(<ObstacleDisplay obstacles={obstacles} />);
  await renderer.advanceFrames(2, 0.01);

  const meshes = renderer.scene
    .findAllByType("Mesh")
    .map((node) => node.instance as unknown as THREE.InstancedMesh);
  /* by material type rather than instanceof: the test renderer bundles its own
     copy of three, so its classes are not the ones the component built with */
  const withMaterial = (type: string) =>
    meshes.find((mesh) => (mesh.material as THREE.Material).type === type);

  return {
    renderer,
    core: withMaterial("MeshStandardMaterial"),
    rim: withMaterial("MeshBasicMaterial"),
  };
}

it("should draw a body and a rim on every obstacle, where the obstacle is", async () => {
  const { core, rim } = await render();
  expect(core, "no lit body").toBeTruthy();
  expect(rim, "no rim shell").toBeTruthy();

  OBSTACLES.forEach((obstacle, index) => {
    const where = obstacle.position.toArray();

    expect(instanceAt(core!, index).position).toEqual(where);
    expect(instanceAt(rim!, index).position).toEqual(where);
  });
});

it("should turn each body on its own, and leave the rim still", async () => {
  const { core, rim } = await render();

  /* the rim is a sphere, so turning it would not show; the bodies are faceted
     and are offset from each other so the cluster does not turn as one piece */
  expect(instanceAt(core!, 0).turned).toBe(true);
  expect(instanceAt(rim!, 0).turned).toBe(false);
});

it("should cast the only shadows in the scene from the body", async () => {
  const { core, rim } = await render();

  // few enough and big enough that the sun's shadow map resolves them sharply,
  // which is what its frustum is sized for
  expect(core!.castShadow).toBe(true);
  expect(core!.receiveShadow).toBe(true);
  expect(rim!.castShadow).toBe(false);
});

it("should draw nothing at all for a world with no obstacles", async () => {
  const { renderer } = await render([]);

  expect(
    renderer.scene
      .findAllByType("Group")
      .find((node) => node.instance.name === GROUP_NAME),
  ).toBeUndefined();
});
