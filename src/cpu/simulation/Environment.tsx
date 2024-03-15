import * as THREE from "three";
import { MutableRefObject, ReactNode, useRef } from "react";
import { Helper } from "@react-three/drei";
import { OCT_TREE_BOUNDARY_SCALE, WORLD_SIZE } from "../config";
import useHelpers from "../hooks/useHelpers";
import BoidStore from "../storage/BoidStore";
import { useFrame } from "@react-three/fiber";

export interface EnvironmentProps {
  storageRef: MutableRefObject<BoidStore>;
}

const tempObject = new THREE.Object3D();

export default function Environment({
  storageRef,
}: EnvironmentProps): ReactNode {
  const storageMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const { showWorldBoundary, showStorageBoundary, showStorageSegmentation } =
    useHelpers();

  useFrame(() => {
    if (!storageMeshRef.current || !showStorageSegmentation) {
      return;
    }

    const boundaries = storageRef.current.boundaries;
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
  });

  return (
    <>
      <hemisphereLight intensity={4} />
      <mesh>
        <boxGeometry args={[WORLD_SIZE, WORLD_SIZE, WORLD_SIZE]} />
        <meshBasicMaterial transparent opacity={0} />
        {showWorldBoundary ? (
          <Helper type={THREE.BoxHelper} args={["royalblue"]} />
        ) : (
          <></>
        )}
      </mesh>
      <mesh>
        <boxGeometry
          args={[
            OCT_TREE_BOUNDARY_SCALE,
            OCT_TREE_BOUNDARY_SCALE,
            OCT_TREE_BOUNDARY_SCALE,
          ]}
        />
        <meshBasicMaterial transparent opacity={0} />
        {showStorageBoundary ? (
          <Helper type={THREE.BoxHelper} args={["red"]} />
        ) : (
          <></>
        )}
      </mesh>
      <instancedMesh
        ref={storageMeshRef}
        args={[undefined, undefined, 10000]}
        visible={showStorageSegmentation}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#a0a0a0" wireframe />
      </instancedMesh>
    </>
  );
}
