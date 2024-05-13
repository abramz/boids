import { useControls } from "leva";
import { useMemo } from "react";
import { WORLD_SIZE } from "../config";
import { BoidProperties } from "../behavior/Boid";

export default function useBoidProperties({
  perceptionRadius,
  fieldOfViewDeg,
  desiredSeparation,
  maxSpeed,
  maxForce,
  boidSize,
}: BoidProperties): BoidProperties {
  const values = useControls(
    "Boid Properties",
    {
      perceptionRadius: {
        label: "Perception radius",
        value: perceptionRadius,
        min: 0,
        max: WORLD_SIZE,
      },
      fieldOfViewDeg: {
        label: "Field of view (deg)",
        value: fieldOfViewDeg,
        min: 0,
        max: 360,
      },
      desiredSeparation: {
        label: "Desired separation",
        value: desiredSeparation,
        min: 0,
        max: WORLD_SIZE,
      },
      maxSpeed: { label: "Max speed", value: maxSpeed, min: 0, max: 30 },
      maxForce: {
        label: "Max force",
        value: maxForce,
        min: 0,
        max: 10,
        step: 0.1,
      },
    },
    { collapsed: true, order: 100 },
  );

  return useMemo(
    () => ({
      ...values,
      boidSize,
    }),
    [values, boidSize],
  );
}
