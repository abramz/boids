import * as THREE from "three";
import { beforeEach, expect, it } from "vitest";
import ReactThreeTestRenderer from "@react-three/test-renderer";
import Boids from "../Boids";
import Boid from "../../behavior/Boid";

const BOID_COUNT = 10;
const BOID_RADIUS = 0.3;
let BOIDS: Boid[];

beforeEach(() => {
  BOIDS = [];

  for (let i = 0; i < BOID_COUNT; i++) {
    BOIDS.push(
      new Boid({
        id: i,
        parentId: i % 5,
        position: new THREE.Vector3(i, i, i),
        velocity: new THREE.Vector3(),
      }),
    );
  }
});

it("should render an instanced mesh", async () => {
  const renderer = await ReactThreeTestRenderer.create(
    <Boids boidSize={BOID_RADIUS} boids={BOIDS} />,
  );

  expect(renderer.scene.findByType("Mesh")).toBeTruthy();
});

it("should render a box geometery with a size equal to the boidSize", async () => {
  const renderer = await ReactThreeTestRenderer.create(
    <Boids boidSize={BOID_RADIUS} boids={BOIDS} />,
  );

  const box = renderer.scene.findByType("BoxGeometry")
    .instance as unknown as THREE.BoxGeometry;
  expect(box.parameters.width).toEqual(BOID_RADIUS);
  expect(box.parameters.height).toEqual(BOID_RADIUS);
  expect(box.parameters.depth).toEqual(BOID_RADIUS);
});

it("should render a box geometery", async () => {
  const renderer = await ReactThreeTestRenderer.create(
    <Boids boidSize={BOID_RADIUS} boids={BOIDS} />,
  );

  const box = renderer.scene.findByType("BoxGeometry")
    .instance as unknown as THREE.BoxGeometry;

  expect(box.parameters).toHaveProperty("width", BOID_RADIUS);
  expect(box.parameters).toHaveProperty("height", BOID_RADIUS);
  expect(box.parameters).toHaveProperty("depth", BOID_RADIUS);
});

it("should render a standard material", async () => {
  const renderer = await ReactThreeTestRenderer.create(
    <Boids boidSize={BOID_RADIUS} boids={BOIDS} />,
  );

  expect(renderer.scene.findByType("MeshStandardMaterial")).toBeTruthy();
});

it("should position the instances to match the positions of the boids", async () => {
  const renderer = await ReactThreeTestRenderer.create(
    <Boids boidSize={BOID_RADIUS} boids={BOIDS} />,
  );

  await renderer.advanceFrames(1, 0.01);

  const mesh = renderer.scene.findByType("Mesh")
    .instance as unknown as THREE.InstancedMesh;

  expect(mesh.instanceMatrix.count).toEqual(BOID_COUNT);

  const tempMatrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  for (const boid of BOIDS) {
    mesh.getMatrixAt(boid.id, tempMatrix);
    position.setFromMatrixPosition(tempMatrix);

    expect(position.toArray()).toEqual([boid.id, boid.id, boid.id]);
  }
});

it("should update the instances' position if the boids move", async () => {
  const renderer = await ReactThreeTestRenderer.create(
    <Boids boidSize={BOID_RADIUS} boids={BOIDS} />,
  );

  await renderer.advanceFrames(2, 0.01); // the Instances component is 1 frame behind, so skip 2

  BOIDS.forEach((boid) =>
    boid.position.set(boid.parentId, boid.parentId, boid.parentId),
  );

  await renderer.advanceFrames(2, 0.01);

  const mesh = renderer.scene.findByType("Mesh")
    .instance as unknown as THREE.InstancedMesh;

  expect(mesh.instanceMatrix.count).toEqual(BOID_COUNT);

  const tempMatrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  for (const boid of BOIDS) {
    mesh.getMatrixAt(boid.id, tempMatrix);
    position.setFromMatrixPosition(tempMatrix);

    expect(position.toArray()).toEqual([
      boid.parentId,
      boid.parentId,
      boid.parentId,
    ]);
  }
});
