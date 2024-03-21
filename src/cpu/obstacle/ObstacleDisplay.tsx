import * as THREE from "three";
import { ReactNode, useLayoutEffect, useRef } from "react";
import Obstacle from "./Obstacle";

export interface ObstacleDisplayProps {
  obstacles: Obstacle[];
}

const tempObject = new THREE.Object3D();

export default function ObstacleDisplay({
  obstacles,
}: ObstacleDisplayProps): ReactNode {
  const ref = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    obstacles.forEach((obstacle, i) => {
      tempObject.position.copy(obstacle.position);
      tempObject.updateMatrix();
      ref.current!.setMatrixAt(i, tempObject.matrix);
    });

    ref.current!.instanceMatrix.needsUpdate = true;
  }, [obstacles]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, obstacles.length]}>
      {/* kludge but they are all the same radius */}
      <sphereGeometry args={[obstacles[0].radius, 64, 32]} />
      <meshStandardMaterial
        color={0x00b4fc}
        emissive={0x00b4fc}
        emissiveIntensity={2}
        toneMapped={false}
      />
    </instancedMesh>
  );
}
