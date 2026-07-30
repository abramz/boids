import * as THREE from "three";
import { ReactNode } from "react";
import useHelpers from "../hooks/useHelpers";
import StorageVisualizer from "./helpers/StorageVisualizer";

export const GROUP_NAME = "Helpers";

export interface HelpersProps {
  worldBoundary: THREE.Box3;
  storageBoundary: THREE.Box3;
  cellBoundaries: () => THREE.Box3[];
}

export default function Helpers({
  worldBoundary,
  storageBoundary,
  cellBoundaries,
}: HelpersProps): ReactNode {
  const { showWorldBoundary, showStorageBoundary, showStorageSegmentation } =
    useHelpers();
  return (
    <group name={GROUP_NAME}>
      <box3Helper
        args={[worldBoundary, "royalblue"]}
        visible={showWorldBoundary}
      />
      <box3Helper
        args={[storageBoundary, "red"]}
        visible={showStorageBoundary}
      />
      <StorageVisualizer
        show={showStorageSegmentation}
        cellBoundaries={cellBoundaries}
      />
    </group>
  );
}
