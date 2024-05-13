import { useControls } from "leva";
import { useMemo } from "react";
import { ForceFactors } from "../behavior/Boid";

export default function useForceFactors({
  alignmentFactor,
  cohesionFactor,
  separationFactor,
  avoidanceFactor,
  seekFactor,
  avoidEdgesFactor,
}: ForceFactors): ForceFactors {
  const factors = useControls(
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
      avoidanceFactor: {
        label: "Avoid",
        value: avoidanceFactor,
        min: 0,
        max: 10,
        step: 0.1,
      },
      seekFactor: {
        label: "Seek",
        value: seekFactor,
        min: 0,
        max: 10,
        step: 0.1,
      },
    },
    { order: 10 },
  );

  return useMemo(
    () => ({
      ...factors,
      avoidEdgesFactor,
    }),
    [factors, avoidEdgesFactor],
  );
}
