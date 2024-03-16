import * as THREE from "three";
import { MutableRefObject, ReactNode, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import useHelpers from "../hooks/useHelpers";
import BoidStore from "../storage/BoidStore";
import { MouseTrackingState } from "../hooks/useMouseTracking";

export interface HelpersProps {
  worldBoundary: THREE.Box3;
  storageBoundary: THREE.Box3;
  storage: BoidStore;
  trackingStateRef: MutableRefObject<MouseTrackingState>;
  trackingTargetRef: MutableRefObject<THREE.Vector3>;
}

const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();

export default function Helpers({
  worldBoundary,
  storageBoundary,
  storage,
  trackingStateRef,
  trackingTargetRef,
}: HelpersProps): ReactNode {
  const storageMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const trackingTargetMeshRef = useRef<THREE.Mesh<
    THREE.SphereGeometry,
    THREE.MeshStandardMaterial
  > | null>(null);
  const { showWorldBoundary, showStorageBoundary, showStorageSegmentation } =
    useHelpers();

  useFrame(() => {
    if (!storageMeshRef.current || !trackingTargetMeshRef.current) {
      return;
    }

    if (showStorageSegmentation) {
      const boundaries = storage.boundaries;
      for (let i = 0; i < 10000; i++) {
        tempObject.clear();

        const boundary = boundaries[i];
        if (boundary) {
          boundary.getCenter(tempObject.position);
          boundary.getSize(tempObject.scale);
        } else {
          tempObject.scale.setScalar(0); // "hide" it
        }

        tempObject.updateMatrix();
        storageMeshRef.current!.setMatrixAt(i, tempObject.matrix);
      }

      storageMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    if (trackingStateRef.current == MouseTrackingState.none) {
      trackingTargetMeshRef.current.visible = false;
    } else {
      trackingTargetMeshRef.current.visible = true;
      tempColor.set(
        trackingStateRef.current === MouseTrackingState.seek
          ? "royalblue"
          : "hotpink",
      );
      trackingTargetMeshRef.current.material.color = tempColor;
      trackingTargetMeshRef.current.position.copy(trackingTargetRef.current);
    }
  });

  return (
    <>
      <box3Helper
        args={[worldBoundary, "royalblue"]}
        visible={showWorldBoundary}
      />
      <box3Helper
        args={[storageBoundary, "red"]}
        visible={showStorageBoundary}
      />
      <instancedMesh
        ref={storageMeshRef}
        args={[undefined, undefined, 10000]}
        visible={showStorageSegmentation}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#a0a0a0" wireframe />
      </instancedMesh>
      <mesh
        ref={trackingTargetMeshRef}
        visible={trackingStateRef.current !== MouseTrackingState.none}
      >
        <sphereGeometry args={[0.2, 64, 64]} />
        <meshStandardMaterial />
      </mesh>
    </>
  );
}
