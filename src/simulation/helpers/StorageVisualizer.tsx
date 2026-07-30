import { useFrame } from "@react-three/fiber";
import { ReactNode, useRef } from "react";
import * as THREE from "three";

export const GROUP_NAME = "StorageVisualizer";

/**
 * How many cells the helper can draw at once. A production tree runs to a few
 * thousand; anything past this is dropped rather than grown into, because this
 * is a debug overlay and reallocating the mesh mid-frame is not worth it.
 */
const CAPACITY = 10000;

const tempObject = new THREE.Object3D();

export interface StorageVisualizerProps {
  show?: boolean;
  /** read fresh each frame: the cells move as the index is rebuilt */
  cellBoundaries: () => THREE.Box3[];
}

export default function StorageVisualizer({
  show = false,
  cellBoundaries,
}: StorageVisualizerProps): ReactNode {
  const meshRef = useRef<THREE.InstancedMesh | null>(null);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!show || !mesh) {
      return;
    }

    const boundaries = cellBoundaries();
    const drawn = Math.min(boundaries.length, CAPACITY);
    for (let i = 0; i < drawn; i++) {
      boundaries[i].getCenter(tempObject.position);
      boundaries[i].getSize(tempObject.scale);
      tempObject.updateMatrix();
      mesh.setMatrixAt(i, tempObject.matrix);
    }

    mesh.count = drawn;
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, CAPACITY]}
      visible={show}
      name={GROUP_NAME}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#a0a0a0" wireframe />
    </instancedMesh>
  );
}
