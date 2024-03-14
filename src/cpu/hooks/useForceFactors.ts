import { useControls } from "leva";

export type ForceFactors = {
  ALIGNMENT_FACTOR: number;
  COHESION_FACTOR: number;
  SEPARATION_FACTOR: number;
  AVOIDANCE_FACTOR: number;
  SEEK_FACTOR: number;
  AVOID_EDGES_FACTOR: number;
};

export default function useForceFactors({
  ALIGNMENT_FACTOR,
  COHESION_FACTOR,
  SEPARATION_FACTOR,
  AVOIDANCE_FACTOR,
  SEEK_FACTOR,
  AVOID_EDGES_FACTOR,
}: ForceFactors): ForceFactors {
  const factors = useControls(
    "Force factors",
    {
      ALIGNMENT_FACTOR: {
        label: "Alignment",
        value: ALIGNMENT_FACTOR,
        min: 0,
        max: 10,
        step: 0.1,
      },
      COHESION_FACTOR: {
        label: "Cohesion",
        value: COHESION_FACTOR,
        min: 0,
        max: 10,
        step: 0.1,
      },
      SEPARATION_FACTOR: {
        label: "Separation",
        value: SEPARATION_FACTOR,
        min: 0,
        max: 10,
        step: 0.1,
      },
      AVOIDANCE_FACTOR: {
        label: "Avoid",
        value: AVOIDANCE_FACTOR,
        min: 0,
        max: 10,
        step: 0.1,
      },
      SEEK_FACTOR: {
        label: "Seek",
        value: SEEK_FACTOR,
        min: 0,
        max: 10,
        step: 0.1,
      },
    },
    { order: 0 },
  );

  return {
    ...factors,
    AVOID_EDGES_FACTOR,
  };
}
