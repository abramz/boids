import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { CAMERA_FOV, cameraDistance, fogDensity } from "../theme";
import {
  SETTLED_STEPS,
  SHIPPED,
  WORLD_SIZE,
} from "../behavior/__tests__/helpers/shipped";
import { runSimulation } from "../behavior/__tests__/helpers/simulate";

/**
 * Where the flock settles against what the scene is framed for.
 *
 * The two are derived from different things and nothing else connects them: the
 * camera and the fog are sized off `worldSize`, while where the flock actually
 * sits is emergent from DRAW_TO_CENTER_FACTOR against COHESION_FACTOR, and the
 * flock settles well outside the world box. Retune either side and this suite
 * catches the flock leaving the frame.
 */

/** The narrowest ordinary window, which is the binding case for a wide flock. */
const ASPECT = 4 / 3;

/** Sampled every this many frames once settled, so one swing cannot dominate. */
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
  it("keeps most of the flock inside the camera's frustum", () => {
    /* measured at 68% on the narrowest ordinary window and 75% on 16:9, and the
       bound here is a floor under both: the rest of the flock is behind the
       camera or out to the sides at any instant, since it circulates through
       frame rather than sitting in it. Pull the camera in, or let the leash
       out, and this is the assertion that fails. */
    expect(flightSample().inFrame).toBeGreaterThan(0.6);
  });

  it("fogs the flock where it flies rather than where the world box ends", () => {
    const { medianDepth } = flightSample();
    const density = fogDensity(WORLD_SIZE);
    /* three's FogExp2: how much of the background has taken over at a depth */
    const fogAt = (depth: number) =>
      1 - Math.exp(-(density * density) * (depth * depth));

    /* the density is derived from the world box, which the flock is mostly
       outside of, so what matters is what it comes to where the boids are:
       enough to read as depth, not so much that the median boid is a smudge */
    expect(fogAt(medianDepth)).toBeGreaterThan(0.05);
    expect(fogAt(medianDepth)).toBeLessThan(0.5);
  });
});
