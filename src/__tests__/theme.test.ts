import { describe, expect, it } from "vitest";
import { FLOCK_SIZE, MIN_FLOCK_SIZE, WORLD_SIZE } from "../config";
import { SUN_POSITION, fogDensity, shadowFrustum } from "../theme";

const WORLD_SIZES = [
  WORLD_SIZE * Math.cbrt(MIN_FLOCK_SIZE / FLOCK_SIZE),
  WORLD_SIZE * 0.8,
  WORLD_SIZE,
];

const fogAt = (density: number, depth: number) =>
  1 - Math.exp(-(density * density) * (depth * depth));

const cornerReach = (worldSize: number) => (worldSize / 2) * Math.sqrt(3);

describe("fogDensity", () => {
  it("dims the far side of the world by the same amount at any world size", () => {
    const dimming = WORLD_SIZES.map((worldSize) =>
      fogAt(fogDensity(worldSize), worldSize),
    );

    dimming.forEach((amount) => expect(amount).toBeCloseTo(dimming[0], 10));
  });

  it("leaves the near side of the flock much clearer than the far", () => {
    WORLD_SIZES.forEach((worldSize) => {
      const density = fogDensity(worldSize);

      expect(fogAt(density, worldSize / 2)).toBeLessThan(0.1);
      expect(fogAt(density, worldSize)).toBeGreaterThan(0.1);
    });
  });
});

describe("shadowFrustum", () => {
  it("reaches the corners of the world cube and no further", () => {
    WORLD_SIZES.forEach((worldSize) => {
      const reach = cornerReach(worldSize);

      expect(shadowFrustum(worldSize).extent).toBeGreaterThanOrEqual(reach);
      expect(shadowFrustum(worldSize).extent).toBeLessThan(reach * 1.1);
    });
  });

  it("brackets the world as seen from the sun, and no more", () => {
    const sunDistance = Math.hypot(...SUN_POSITION);

    WORLD_SIZES.forEach((worldSize) => {
      const { near, far } = shadowFrustum(worldSize);
      const reach = cornerReach(worldSize);

      expect(near).toBeLessThanOrEqual(sunDistance - reach);
      expect(far).toBeGreaterThanOrEqual(sunDistance + reach);
      expect(near).toBeGreaterThan(0);
    });
  });
});
