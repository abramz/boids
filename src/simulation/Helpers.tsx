import * as THREE from "three";
import { ReactNode } from "react";
import useHelpers from "../hooks/useHelpers";
import BoidStore from "../storage/BoidStore";
import StorageVisualizer from "./helpers/StorageVisualizer";

export const GROUP_NAME = "Helpers";

export interface HelpersProps {
  worldBoundary: THREE.Box3;
  storageBoundary: THREE.Box3;
  storage: BoidStore;
}

export default function Helpers({
  worldBoundary,
  storageBoundary,
  storage,
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
      <StorageVisualizer show={showStorageSegmentation} storage={storage} />
    </group>
  );
}
