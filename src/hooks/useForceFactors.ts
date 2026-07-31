import { useControls } from "leva";
import { ForceFactors } from "../behavior/Boid";
import * as config from "../config";

/**
 * How hard each behaviour pulls.
 *
 * All of it tunable, and all of it down to nothing bar the draw to center:
 * turning off edge avoidance is a reasonable thing to want to watch, and with
 * no wall on the index either the flock would have nothing left to bring it
 * back. That one bottoms out just above zero instead.
 */
export default function useForceFactors({
  alignmentFactor,
  cohesionFactor,
  separationFactor,
  avoidEdgesFactor,
  avoidObstaclesFactor,
  drawToCenterFactor,
}: ForceFactors): ForceFactors {
  return useControls(
    "Force factors",
    {
      alignmentFactor: {
        label: "Alignment",
        value: alignmentFactor,
        min: 0,
        max: 10,
        step: 0.1,
      },
      cohesionFactor: {
        label: "Cohesion",
        value: cohesionFactor,
        min: 0,
        max: 10,
        step: 0.1,
      },
      separationFactor: {
        label: "Separation",
        value: separationFactor,
        min: 0,
        max: 10,
        step: 0.1,
      },
      avoidEdgesFactor: {
        label: "Avoid edges",
        value: avoidEdgesFactor,
        min: 0,
        max: 100,
        step: 0.5,
      },
      avoidObstaclesFactor: {
        label: "Avoid obstacles",
        value: avoidObstaclesFactor,
        min: 0,
        max: 100,
        step: 0.5,
      },
      drawToCenterFactor: {
        label: "Draw to center",
        value: drawToCenterFactor,
        min: config.MIN_DRAW_TO_CENTER_FACTOR,
        max: 10,
        step: 0.1,
      },
    },
    { order: 10 },
  );
}
