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
        parentId: Math.floor(i / 2) % 3,
        position: new THREE.Vector3(i, i, i),
        velocity: new THREE.Vector3(),
      }),
    );
  }
});

it("draws the whole flock as one instanced mesh", async () => {
  const renderer = await ReactThreeTestRenderer.create(
    <Boids boidSize={BOID_RADIUS} boids={BOIDS} />,
  );

  const meshes = renderer.scene.findAllByType("Mesh");
  expect(meshes).toHaveLength(1);

  const mesh = meshes[0].instance as unknown as THREE.InstancedMesh;
  expect(mesh.instanceMatrix.count).toEqual(BOID_COUNT);
  expect(mesh.frustumCulled).toBe(false);

  expect(mesh.geometry.groups.map((group) => group.materialIndex)).toEqual([
    0, 1,
  ]);
});

it("lights the hull and adds the plume over whatever it crosses", async () => {
  const renderer = await ReactThreeTestRenderer.create(
    <Boids boidSize={BOID_RADIUS} boids={BOIDS} />,
  );

  const mesh = renderer.scene.findByType("Mesh")
    .instance as unknown as THREE.InstancedMesh;
  const [hull, plume] = mesh.material as THREE.Material[];

  expect(hull).toBeInstanceOf(THREE.MeshStandardMaterial);

  expect(plume.blending).toEqual(THREE.AdditiveBlending);
  expect(plume.depthWrite).toBe(false);
});

it("reaches as far forward as the maths take a boid to reach", async () => {
  const renderer = await ReactThreeTestRenderer.create(
    <Boids boidSize={BOID_RADIUS} boids={BOIDS} />,
  );

  const mesh = renderer.scene.findByType("Mesh")
    .instance as unknown as THREE.InstancedMesh;
  const bounds = new THREE.Box3().setFromBufferAttribute(
    mesh.geometry.getAttribute("position") as THREE.BufferAttribute,
  );

  expect(bounds.max.y).toBeCloseTo(BOID_RADIUS);

  const position = mesh.geometry.getAttribute("position");
  const widest = Math.max(
    ...Array.from({ length: position.count }, (_, index) =>
      Math.hypot(position.getX(index), position.getZ(index)),
    ),
  );
  expect(widest).toBeCloseTo(BOID_RADIUS * BOID_RADIUS_RATIO);

  expect(bounds.min.y).toBeCloseTo(
    -BOID_RADIUS * (BOID_LENGTH_RATIO / 2 + BOID_PLUME_LENGTH_RATIO),
  );
});

it("gives each flock its own color, per instance", async () => {
  const renderer = await ReactThreeTestRenderer.create(
    <Boids boidSize={BOID_RADIUS} boids={BOIDS} />,
  );

  const mesh = renderer.scene.findByType("Mesh")
    .instance as unknown as THREE.InstancedMesh;

  expect(mesh.instanceColor, "no per-instance color buffer").toBeTruthy();

  expect(mesh.instanceColor?.version).toBeGreaterThan(0);

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

it("points each dart along the velocity of its boid", async () => {
  BOIDS.forEach((boid) => boid.velocity.set(0, 0, 3));

  const renderer = await ReactThreeTestRenderer.create(
    <Boids boidSize={BOID_RADIUS} boids={BOIDS} />,
  );

  await renderer.advanceFrames(2, 0.01);

  const mesh = renderer.scene.findByType("Mesh")
    .instance as unknown as THREE.InstancedMesh;

  const tempMatrix = new THREE.Matrix4();
  const heading = new THREE.Vector3();
  for (const boid of BOIDS) {
    mesh.getMatrixAt(boid.id, tempMatrix);
    heading.setFromMatrixColumn(tempMatrix, 1).normalize();

    expect(heading.x).toBeCloseTo(0);
    expect(heading.y).toBeCloseTo(0);
    expect(heading.z).toBeCloseTo(1);
  }
});

it("positions the instances where the boids are, and keeps up as they move", async () => {
  const renderer = await ReactThreeTestRenderer.create(
    <Boids boidSize={BOID_RADIUS} boids={BOIDS} />,
  );

  await renderer.advanceFrames(2, 0.01);

  const mesh = renderer.scene.findByType("Mesh")
    .instance as unknown as THREE.InstancedMesh;
  const tempMatrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const drawnAt = (boid: Boid): number[] => {
    mesh.getMatrixAt(boid.id, tempMatrix);

    return position.setFromMatrixPosition(tempMatrix).toArray();
  };

  expect(mesh.instanceMatrix.count).toEqual(BOID_COUNT);
  BOIDS.forEach((boid) =>
    expect(drawnAt(boid)).toEqual([boid.id, boid.id, boid.id]),
  );

  const uploaded = mesh.instanceMatrix.version;
  expect(uploaded).toBeGreaterThan(0);

  BOIDS.forEach((boid) => boid.position.set(-boid.id, boid.id, -boid.id));
  await renderer.advanceFrames(2, 0.01);

  BOIDS.forEach((boid) =>
    expect(drawnAt(boid)).toEqual([-boid.id, boid.id, -boid.id]),
  );
  expect(mesh.instanceMatrix.version).toBeGreaterThan(uploaded);
});
