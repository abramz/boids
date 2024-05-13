import { useFrame } from "@react-three/fiber";
import { ReactNode, useRef } from "react";
import * as THREE from "three";
import BoidStore from "../../storage/BoidStore";

export interface StorageVisualizerProps {
  show?: boolean;
  storage: BoidStore;
}

const tempObject = new THREE.Object3D();

export default function StorageVisualizer({
  show = false,
  storage,
}: StorageVisualizerProps): ReactNode {
  const meshRef = useRef<THREE.InstancedMesh | null>(null);

  useFrame(() => {
    if (show) {
      const boundaries = storage.boundaries;
      for (let i = 0; i < 10000; i++) {
        const boundary = boundaries[i];
        if (boundary) {
          boundary.getCenter(tempObject.position);
          boundary.getSize(tempObject.scale);
        } else {
          tempObject.scale.setScalar(0); // "hide" it
        }

        tempObject.updateMatrix();
        meshRef.current!.setMatrixAt(i, tempObject.matrix);
      }

      meshRef.current!.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, 10000]}
      visible={show}
      name="StorageVisualizer"
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#a0a0a0" wireframe />
    </instancedMesh>
  );
}
