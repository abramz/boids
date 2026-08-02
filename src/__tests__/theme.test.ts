import { describe, expect, it } from "vitest";
import { FLOCK_SIZE, MIN_FLOCK_SIZE, WORLD_SIZE } from "../config";
import { SUN_POSITION, fogDensity, shadowFrustum } from "../theme";

/**
 * The world a machine gets is WORLD_SIZE scaled by the cube root of the flock it
 * can carry, so anything dressing the world has to be a function of that rather
 * than of the constant. These pin the invariants the two derivations exist for,
 * across the range of worlds useWorldSize.ts can hand out.
 */

/** The smallest world, from MIN_FLOCK_SIZE, up to the largest. */
const WORLD_SIZES = [
  WORLD_SIZE * Math.cbrt(MIN_FLOCK_SIZE / FLOCK_SIZE),
  WORLD_SIZE * 0.8,
  WORLD_SIZE,
];

/** three's FogExp2: how much of the background has taken over at this depth. */
const fogAt = (density: number, depth: number) =>
  1 - Math.exp(-(density * density) * (depth * depth));

/** Half the space diagonal of the world cube, which is its furthest corner. */
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

      /* readable rather than washed out where the flock actually flies, and
         thick enough at the far wall to read as depth rather than as nothing */
      expect(fogAt(density, worldSize / 2)).toBeLessThan(0.1);
      expect(fogAt(density, worldSize)).toBeGreaterThan(0.1);
    });
  });
});

describe("shadowFrustum", () => {
  it("reaches the corners of the world cube and no further", () => {
    WORLD_SIZES.forEach((worldSize) => {
      const reach = cornerReach(worldSize);

      /* short leaves the corners of the world unshadowed, and well past them is
         shadow map resolution thrown away */
      expect(shadowFrustum(worldSize).extent).toBeGreaterThanOrEqual(reach);
      expect(shadowFrustum(worldSize).extent).toBeLessThan(reach * 1.1);
    });
  });

  it("brackets the world as seen from the sun, and no more", () => {
    /* derived from where the sun actually is, not from the frustum under test:
       taken as the midpoint of near and far this passes for any interval,
       however far off the world it is centred */
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
