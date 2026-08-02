import { act, renderHook } from "@testing-library/react";
import { expect, it } from "vitest";
import { levaStore } from "leva";
import * as config from "../../config";
import useForceFactors from "../useForceFactors";

const SHIPPED = {
  alignmentFactor: config.ALIGNMENT_FACTOR,
  cohesionFactor: config.COHESION_FACTOR,
  separationFactor: config.SEPARATION_FACTOR,
  avoidEdgesFactor: config.AVOID_EDGES_FACTOR,
  avoidObstaclesFactor: config.AVOID_OBSTACLES_FACTOR,
  drawToCenterFactor: config.DRAW_TO_CENTER_FACTOR,
};

/* driven through leva's own store rather than through a schema assertion: what
   has to hold is that a value the panel is dragged to comes back clamped */
function drag(control: keyof typeof SHIPPED, to: number): void {
  act(() => levaStore.setValueAtPath(`Force factors.${control}`, to, true));
}

it("will not let the leash be tuned down to nothing", () => {
  // edge avoidance ships off and the index has no outer wall, so a draw to
  // center of zero leaves nothing at all to bring a strayed flock back
  const { result } = renderHook(() => useForceFactors(SHIPPED));

  drag("drawToCenterFactor", 0);

  expect(result.current.drawToCenterFactor).toBe(
    config.MIN_DRAW_TO_CENTER_FACTOR,
  );
});

it("lets every other force be turned off outright", () => {
  const { result } = renderHook(() => useForceFactors(SHIPPED));

  drag("alignmentFactor", 0);
  drag("avoidObstaclesFactor", 0);

  expect(result.current.alignmentFactor).toBe(0);
  expect(result.current.avoidObstaclesFactor).toBe(0);
});
