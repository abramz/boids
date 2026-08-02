import { useControls } from "leva";
import { ForceFactors } from "../behavior/Boid";
import * as config from "../config";

/**
 * How hard each behaviour pulls.
 *
 * Every factor tunes down to nothing except the draw to center, which bottoms
 * out just above zero: edge avoidance ships off and the index has no outer
 * wall, so a leash that could be switched off leaves nothing to bring a strayed
 * flock back.
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
