import * as THREE from "three";
import { beforeAll, describe, expect, it } from "vitest";
import { CAMERA_FOV, cameraDistance, fogDensity } from "../theme";
import {
  SETTLED_STEPS,
  SHIPPED,
  WORLD_SIZE,
} from "../behavior/__tests__/helpers/shipped";
import { runSimulation } from "../behavior/__tests__/helpers/simulate";

const ASPECT = 4 / 3;

const SAMPLE_EVERY = 20;

function flightSample() {
  const camera = new THREE.PerspectiveCamera(CAMERA_FOV, ASPECT, 0.1, 1000);
  camera.position.set(0, 0, cameraDistance(WORLD_SIZE));
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  camera.updateProjectionMatrix();

  const frustum = new THREE.Frustum().setFromProjectionMatrix(
    new THREE.Matrix4().multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse,
    ),
  );

  const depths: number[] = [];
  let inFrame = 0;
  let total = 0;

  runSimulation({
    config: SHIPPED,
    steps: SETTLED_STEPS * 3,
    onStep: ({ boids }, step) => {
      if (step < SETTLED_STEPS || step % SAMPLE_EVERY !== 0) {
        return;
      }

      boids.forEach((boid) => {
        total++;
        if (frustum.containsPoint(boid.position)) {
          inFrame++;
        }
        depths.push(camera.position.distanceTo(boid.position));
      });
    },
  });

  depths.sort((a, b) => a - b);

  return {
    inFrame: inFrame / total,
    medianDepth: depths[Math.floor(depths.length / 2)],
  };
}

describe("the shipped framing", () => {
  let flight: ReturnType<typeof flightSample>;

  beforeAll(() => {
    flight = flightSample();
  });

  it("keeps most of the flock inside the camera's frustum", () => {
    expect(flight.inFrame).toBeGreaterThan(0.6);
  });

  it("fogs the flock where it flies rather than where the world box ends", () => {
    const { medianDepth } = flight;
    const density = fogDensity(WORLD_SIZE);
    const fogAt = (depth: number) =>
      1 - Math.exp(-(density * density) * (depth * depth));

    expect(fogAt(medianDepth)).toBeGreaterThan(0.05);
    expect(fogAt(medianDepth)).toBeLessThan(0.5);
  });
});
