import * as THREE from "three";
import { expect, it, vi } from "vitest";
import initialize from "../initialize";

const acceptableDiff = 0.00000001; // JS numbers are weird

vi.mock("../../helpers/determineFlockSize", () => ({
  default: vi.fn((arg: number): Promise<number> => Promise.resolve(arg)),
}));

it("should initialize the simulation", async () => {
  const boidCount = 100;
  const flockCount = 5;
  const speed = 3;
  const worldBoundary = new THREE.Box3(
    new THREE.Vector3(-10, -10, -10),
    new THREE.Vector3(10, 10, 10),
  );
  const storageBoundary = new THREE.Box3(
    new THREE.Vector3(-15, -15, -15),
    new THREE.Vector3(15, 15, 15),
  );

  const result = await initialize(
    boidCount,
    flockCount,
    speed,
    worldBoundary,
    storageBoundary,
  );

  expect(result.boids).toHaveLength(boidCount * flockCount);

  result.boids.forEach((boid) => {
    expect(speed - boid.velocity.length()).toBeLessThan(acceptableDiff);

    expect(Math.abs(boid.position.x)).toBeLessThan(10);
    expect(Math.abs(boid.position.y)).toBeLessThan(10);
    expect(Math.abs(boid.position.z)).toBeLessThan(10);
  });
});
