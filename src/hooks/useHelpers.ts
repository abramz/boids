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
      showStorageCells: {
        label: "Show storage cells",
        toggle: true,
        value: false,
      },
    },
    { collapsed: true, order: 1000 },
  );
}
