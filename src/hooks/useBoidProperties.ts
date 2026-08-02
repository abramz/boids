import { useControls } from "leva";
import { useMemo } from "react";
import { BoidProperties } from "../behavior/Boid";

/**
 * The tunable half of a boid's properties, bounded by the world this machine
 * got rather than the largest one. Past the world's own width a wider radius
 * buys nothing: the neighbour cap already decides how many of what it turns up
 * a boid steers by, so all the extra reach costs is the query.
 */
export default function useBoidProperties(
  worldSize: number,
  {
    perceptionRadius,
    fieldOfViewDeg,
    desiredSeparation,
    neighbourLimit,
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
      neighbourLimit: {
        label: "Neighbours",
        value: neighbourLimit,
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
      /* leva has no way to bound one control by another, and a minimum above
         the maximum makes maxSpeed stop meaning anything: THREE's clamp
         resolves an inverted range to its lower bound */
      minSpeed: Math.min(values.minSpeed, values.maxSpeed),
      boidSize,
    }),
    [values, boidSize],
  );
}
