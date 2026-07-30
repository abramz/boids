import * as THREE from "three";
import { beforeEach, expect, it } from "vitest";
import ReactThreeTestRenderer from "@react-three/test-renderer";
import Boids from "../Boids";
import Boid from "../../behavior/Boid";
import {
  BOID_LENGTH_RATIO,
  BOID_PLUME_LENGTH_RATIO,
  BOID_RADIUS_RATIO,
  FLOCK_COLORS,
} from "../../theme";

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

it("should draw the whole flock as one instanced mesh", async () => {
  const renderer = await ReactThreeTestRenderer.create(
    <Boids boidSize={BOID_RADIUS} boids={BOIDS} />,
  );

  const meshes = renderer.scene.findAllByType("Mesh");
  expect(meshes).toHaveLength(1);

  const mesh = meshes[0].instance as unknown as THREE.InstancedMesh;
  expect(mesh.instanceMatrix.count).toEqual(BOID_COUNT);
  // one draw call spanning the world, so there is nothing for culling to save
  // and a stale bounding sphere would drop the lot at once
  expect(mesh.frustumCulled).toBe(false);
});

it("should reach as far forward as the maths take a boid to reach", async () => {
  const renderer = await ReactThreeTestRenderer.create(
    <Boids boidSize={BOID_RADIUS} boids={BOIDS} />,
  );

  const mesh = renderer.scene.findByType("Mesh")
    .instance as unknown as THREE.InstancedMesh;
  const bounds = new THREE.Box3().setFromBufferAttribute(
    mesh.geometry.getAttribute("position") as THREE.BufferAttribute,
  );

  // deriveBoidProperties reads boid size as a radius, so the nose has to sit
  // exactly that far along +Y from the position the simulation tracks
  expect(bounds.max.y).toBeCloseTo(BOID_RADIUS);

  // and it stays slender across that axis. Measured radially rather than off
  // the bounding box, which for a faceted hull is narrower than its radius
  const position = mesh.geometry.getAttribute("position");
  const widest = Math.max(
    ...Array.from({ length: position.count }, (_, index) =>
      Math.hypot(position.getX(index), position.getZ(index)),
    ),
  );
  expect(widest).toBeCloseTo(BOID_RADIUS * BOID_RADIUS_RATIO);

  // and the plume trails off the other end without moving the hull
  expect(bounds.min.y).toBeCloseTo(
    -BOID_RADIUS * (BOID_LENGTH_RATIO / 2 + BOID_PLUME_LENGTH_RATIO),
  );
});

it("should give each flock its own colour, per instance", async () => {
  const renderer = await ReactThreeTestRenderer.create(
    <Boids boidSize={BOID_RADIUS} boids={BOIDS} />,
  );

  const mesh = renderer.scene.findByType("Mesh")
    .instance as unknown as THREE.InstancedMesh;

  /* the hull shader reads vColor, which three only feeds from instanceColor
     when the buffer exists - without it every flock draws the same colour and
     the emissive floor goes with it */
  expect(mesh.instanceColor, "no per-instance colour buffer").toBeTruthy();

  const drawn = new THREE.Color();
  BOIDS.forEach((boid) => {
    mesh.getColorAt(boid.id, drawn);

    expect(drawn.getHex()).toEqual(
      new THREE.Color(
        FLOCK_COLORS[boid.parentId % FLOCK_COLORS.length],
      ).getHex(),
    );
  });
});

it("should draw the hull lit and the plume additively", async () => {
  const renderer = await ReactThreeTestRenderer.create(
    <Boids boidSize={BOID_RADIUS} boids={BOIDS} />,
  );

  const mesh = renderer.scene.findByType("Mesh")
    .instance as unknown as THREE.InstancedMesh;
  const [hull, plume] = mesh.material as THREE.Material[];

  // one group per material, or three draws the whole dart with one of them
  expect(mesh.geometry.groups.map((group) => group.materialIndex)).toEqual([
    0, 1,
  ]);

  expect(hull).toBeInstanceOf(THREE.MeshStandardMaterial);
  expect(plume.blending).toEqual(THREE.AdditiveBlending);
  expect(plume.depthWrite).toBe(false);
});

it("should point each dart along the velocity of its boid", async () => {
  BOIDS.forEach((boid) => boid.velocity.set(0, 0, 3));

  const renderer = await ReactThreeTestRenderer.create(
    <Boids boidSize={BOID_RADIUS} boids={BOIDS} />,
  );

  await renderer.advanceFrames(2, 0.01); // the Instances component is 1 frame behind

  const mesh = renderer.scene.findByType("Mesh")
    .instance as unknown as THREE.InstancedMesh;

  const tempMatrix = new THREE.Matrix4();
  const heading = new THREE.Vector3();
  for (const boid of BOIDS) {
    mesh.getMatrixAt(boid.id, tempMatrix);
    // the dart stands on +Y, so its heading is the matrix's second column
    heading.setFromMatrixColumn(tempMatrix, 1).normalize();

    expect(heading.x).toBeCloseTo(0);
    expect(heading.y).toBeCloseTo(0);
    expect(heading.z).toBeCloseTo(1);
  }
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
