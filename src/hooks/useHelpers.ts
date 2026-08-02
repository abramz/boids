import { useControls } from "leva";

export interface Helpers {
  showWorldBoundary: boolean;
  showStorageCells: boolean;
}

export default function useHelpers(): Helpers {
  return useControls(
    "Helpers",
    {
      showWorldBoundary: { label: "Show world boundary", value: false },
      showStorageCells: { label: "Show storage cells", value: false },
    },
    { collapsed: true, order: 1000 },
  );
}
