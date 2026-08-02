import * as THREE from "three";
import { ReactNode } from "react";
import useHelpers from "../hooks/useHelpers";
import StorageVisualizer from "./helpers/StorageVisualizer";

export const GROUP_NAME = "Helpers";

export interface HelpersProps {
  worldBoundary: THREE.Box3;
  occupiedCells: () => THREE.Box3[];
}

export default function Helpers({
  worldBoundary,
  occupiedCells,
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
        occupiedCells={occupiedCells}
      />
    </group>
  );
}
