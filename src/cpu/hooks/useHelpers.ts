import { useControls } from "leva";

export default function useHelpers(): {
  showWorldBoundary: boolean;
  showStorageBoundary: boolean;
} {
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
    },
    { collapsed: true, order: 3 },
  );
}
