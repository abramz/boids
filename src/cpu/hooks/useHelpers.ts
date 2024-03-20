import { useControls } from "leva";

export default function useHelpers() {
  return useControls(
    "Helpers",
    {
      showWorldBoundary: {
        label: "Show world boundary",
        toggle: true,
        value: false,
      },
      showStorageBoundary: {
        label: "Show storage boundary",
        toggle: true,
        value: false,
      },
      showStorageSegmentation: {
        label: "Show storage segmentation",
        toggle: true,
        value: false,
      },
      showMouseTrackingPosition: {
        label: "Show mouse when tracking",
        toggle: true,
        value: false,
      },
    },
    { collapsed: true, order: 1000 },
  );
}
