import * as THREE from "three";
import { expect, it, vi } from "vitest";
import { create } from "@react-three/test-renderer";
import StorageVisualizer, { GROUP_NAME } from "../StorageVisualizer";

const CELLS = [
  new THREE.Box3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(2, 2, 2)),
  new THREE.Box3(new THREE.Vector3(-6, 4, 4), new THREE.Vector3(-4, 6, 6)),
];

const tempMatrix = new THREE.Matrix4();
const tempPosition = new THREE.Vector3();
const tempQuaternion = new THREE.Quaternion();
const tempScale = new THREE.Vector3();

async function render(show: boolean, cells: () => THREE.Box3[]) {
  const renderer = await create(
    <StorageVisualizer show={show} occupiedCells={cells} />,
  );
  await renderer.advanceFrames(2, 0.01);

  return renderer.scene
    .findAll((node) => node.instance.name === GROUP_NAME)
    .map((node) => node.instance)[0] as unknown as THREE.InstancedMesh;
}

it("draws one box over each cell the index is holding", async () => {
  const mesh = await render(true, () => CELLS);

  expect(mesh.count).toBe(CELLS.length);

  CELLS.forEach((cell, index) => {
    mesh.getMatrixAt(index, tempMatrix);
    tempMatrix.decompose(tempPosition, tempQuaternion, tempScale);

    expect(tempPosition.toArray()).toEqual(
      cell.getCenter(new THREE.Vector3()).toArray(),
    );
    expect(tempScale.toArray()).toEqual(
      cell.getSize(new THREE.Vector3()).toArray(),
    );
  });
});

it("follows the cells as the index is rebuilt under it", async () => {
  const moved = new THREE.Box3(
    new THREE.Vector3(20, 20, 20),
    new THREE.Vector3(22, 22, 22),
  );
  const cells = vi
    .fn<() => THREE.Box3[]>()
    .mockReturnValueOnce([CELLS[0]])
    .mockReturnValue([moved]);

  const mesh = await render(true, cells);

  expect(cells.mock.calls.length).toBeGreaterThan(1);

  mesh.getMatrixAt(0, tempMatrix);
  tempMatrix.decompose(tempPosition, tempQuaternion, tempScale);
  expect(tempPosition.toArray()).toEqual([21, 21, 21]);
});

it("does no frame work at all while it is switched off", async () => {
  const cells = vi.fn<() => THREE.Box3[]>().mockReturnValue(CELLS);

  const mesh = await render(false, cells);

  expect(mesh.visible).toBe(false);
  expect(cells).not.toHaveBeenCalled();
});
