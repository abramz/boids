import { useControls } from "leva";
import { useMemo } from "react";
import { BoidProperties } from "../behavior/Boid";

export default function useBoidProperties(
  worldSize: number,
  {
    perceptionRadius,
    fieldOfViewDeg,
    desiredSeparation,
    neighborLimit,
    minSpeed,
    maxSpeed,
    maxForce,
    boidSize,
  }: BoidProperties,
): BoidProperties {
  const values = useControls(
    "Boid Properties",
    {
      perceptionRadius: {
        label: "Perception radius",
        value: perceptionRadius,
        min: 0,
        max: worldSize,
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
        max: worldSize,
      },
      neighborLimit: {
        label: "Neighbors",
        value: neighborLimit,
        min: 1,
        max: 32,
        step: 1,
      },
      minSpeed: { label: "Min speed", value: minSpeed, min: 0, max: 30 },
      maxSpeed: { label: "Max speed", value: maxSpeed, min: 0, max: 30 },
      maxForce: {
        label: "Max force",
        value: maxForce,
        min: 0,
        max: 60,
        step: 0.5,
      },
    },
    { collapsed: true, order: 100 },
  );

  return useMemo(
    () => ({
      ...values,
      minSpeed: Math.min(values.minSpeed, values.maxSpeed),
      boidSize,
    }),
    [values, boidSize],
  );
}
