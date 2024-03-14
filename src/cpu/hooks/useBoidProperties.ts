import { useControls } from "leva";
import { WORLD_SIZE } from "../config";

export type BoidProperties = {
  PERCEPTION_RADIUS: number;
  FIELD_OF_VIEW_DEG: number;
  DESIRED_SEPARATION: number;
  MAX_SPEED: number;
  MAX_FORCE: number;
};

export default function useBoidProperties({
  PERCEPTION_RADIUS,
  FIELD_OF_VIEW_DEG,
  DESIRED_SEPARATION,
  MAX_SPEED,
  MAX_FORCE,
}: BoidProperties): BoidProperties {
  return useControls(
    "Boid Properties",
    {
      PERCEPTION_RADIUS: {
        label: "Perception radius",
        value: PERCEPTION_RADIUS,
        min: 0,
        max: WORLD_SIZE,
      },
      FIELD_OF_VIEW_DEG: {
        label: "Field of view (deg)",
        value: FIELD_OF_VIEW_DEG,
        min: 0,
        max: 360,
      },
      DESIRED_SEPARATION: {
        label: "Desired separation",
        value: DESIRED_SEPARATION,
        min: 0,
        max: WORLD_SIZE,
      },
      MAX_SPEED: { label: "Max speed", value: MAX_SPEED, min: 0, max: 30 },
      MAX_FORCE: {
        label: "Max force",
        value: MAX_FORCE,
        min: 0,
        max: 10,
        step: 0.1,
      },
    },
    { collapsed: true, order: 1 },
  );
}
