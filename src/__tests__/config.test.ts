import { expect, it } from "vitest";
import * as config from "../config";
import { queriedRadius } from "../behavior/deriveBoidProperties";

it("sizes an index cell to the radius a boid actually queries", () => {
  /* config is a leaf and does not import the behaviour layer, so the two write
     the derivation out separately. A cell a hair under the radius queried is a
     whole extra ring of cells walked on every side of every query. */
  expect(config.GRID_CELL_SIZE).toBe(
    queriedRadius(config.PERCEPTION_RADIUS, config.BOID_SIZE),
  );
});
