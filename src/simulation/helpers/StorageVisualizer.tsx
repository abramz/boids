import { useFrame } from "@react-three/fiber";
import { ReactNode, useLayoutEffect, useRef } from "react";
import * as THREE from "three";

export const GROUP_NAME = "StorageVisualizer";

const CAPACITY = 10000;

const tempObject = new THREE.Object3D();

export interface StorageVisualizerProps {
  show?: boolean;
  occupiedCells: () => THREE.Box3[];
}

export default function StorageVisualizer({
  show = false,
  occupiedCells,
}: StorageVisualizerProps): ReactNode {
  const meshRef = useRef<THREE.InstancedMesh | null>(null);

  useLayoutEffect(() => {
    meshRef.current?.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  }, []);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!show || !mesh) {
      return;
    }

    const cells = occupiedCells();
    const drawn = Math.min(cells.length, CAPACITY);
    for (let index = 0; index < drawn; index++) {
      cells[index].getCenter(tempObject.position);
      cells[index].getSize(tempObject.scale);
      tempObject.updateMatrix();
      mesh.setMatrixAt(index, tempObject.matrix);
    }

    mesh.count = drawn;
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, CAPACITY]}
      visible={show}
      frustumCulled={false}
      name={GROUP_NAME}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#a0a0a0" wireframe />
    </instancedMesh>
  );
}
