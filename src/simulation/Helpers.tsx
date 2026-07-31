import * as THREE from "three";
import { ReactNode } from "react";
import useHelpers from "../hooks/useHelpers";
import StorageVisualizer from "./helpers/StorageVisualizer";

export const GROUP_NAME = "Helpers";

export interface HelpersProps {
  worldBoundary: THREE.Box3;
  cellBoundaries: () => THREE.Box3[];
}

export default function Helpers({
  worldBoundary,
  cellBoundaries,
}: HelpersProps): ReactNode {
  const { showWorldBoundary, showStorageCells } = useHelpers();
  return (
    <group name={GROUP_NAME}>
      <box3Helper
        args={[worldBoundary, "royalblue"]}
        visible={showWorldBoundary}
      />
      <StorageVisualizer
        show={showStorageCells}
        cellBoundaries={cellBoundaries}
      />
    </group>
  );
}
