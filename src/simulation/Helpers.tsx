import * as THREE from "three";
import { MutableRefObject, ReactNode } from "react";
import useHelpers from "../hooks/useHelpers";
import BoidStore from "../storage/BoidStore";
import { MouseTrackingState } from "../hooks/useMouseTracking";
import StorageVisualizer from "./helpers/StorageVisualizer";
import MouseVisualizer from "./helpers/MouseVisualizer";

export const GROUP_NAME = "Helpers";

export interface HelpersProps {
  worldBoundary: THREE.Box3;
  storageBoundary: THREE.Box3;
  storage: BoidStore;
  trackingStateRef: MutableRefObject<MouseTrackingState>;
  trackingTargetRef: MutableRefObject<THREE.Vector3>;
}

export default function Helpers({
  worldBoundary,
  storageBoundary,
  storage,
  trackingStateRef,
  trackingTargetRef,
}: HelpersProps): ReactNode {
  const {
    showWorldBoundary,
    showStorageBoundary,
    showStorageSegmentation,
    showMouseTrackingPosition,
  } = useHelpers();
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
      <MouseVisualizer
        show={showMouseTrackingPosition}
        trackingStateRef={trackingStateRef}
        trackingTargetRef={trackingTargetRef}
      />
    </group>
  );
}
