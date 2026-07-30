import { useControls } from "leva";
import { ForceFactors } from "../behavior/Boid";

/** How hard each behaviour pulls, all of it tunable. */
export default function useForceFactors({
  alignmentFactor,
  cohesionFactor,
  separationFactor,
  avoidEdgesFactor,
  avoidObstaclesFactor,
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
    },
    { order: 10 },
  );
}
