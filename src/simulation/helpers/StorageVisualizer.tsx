import { useFrame } from "@react-three/fiber";
import { ReactNode, useLayoutEffect, useRef } from "react";
import * as THREE from "three";

export const GROUP_NAME = "StorageVisualizer";

/**
 * How many cells the helper can draw at once. A production flock occupies a few
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

  /* rewritten every frame, and three's default hint says the opposite. It
     cannot be changed once the buffer has been used. */
  useLayoutEffect(() => {
    meshRef.current?.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  }, []);

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
    /* culling off for the same reason as the flock: an InstancedMesh computes
       its bounding sphere once and writing instance matrices does not
       invalidate it, so the overlay would be tested against wherever the cells
       happened to be on the frame it was switched on */
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
