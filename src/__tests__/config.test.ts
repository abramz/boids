import { expect, it } from "vitest";
import * as config from "../config";
import { queriedRadius } from "../behavior/deriveBoidProperties";

it("sizes an index cell to the radius a boid actually queries", () => {
  expect(config.GRID_CELL_SIZE).toBe(
    queriedRadius(config.PERCEPTION_RADIUS, config.BOID_SIZE),
  );
});
