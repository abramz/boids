import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import createFacingGlow from "../helpers/facingGlow";
import {
  OBSTACLE_CORE_COLOR,
  OBSTACLE_CORE_DETAIL,
  OBSTACLE_RIM_COLOR,
  OBSTACLE_RIM_DETAIL,
  OBSTACLE_RIM_INTENSITY,
  OBSTACLE_RIM_POWER,
  OBSTACLE_RIM_SCALE,
  OBSTACLE_SPIN_SPEED,
} from "../theme";
import Obstacle from "./Obstacle";

export const GROUP_NAME = "Obstacles";

const tempObject = new THREE.Object3D();

const createRimMaterial = () =>
  createFacingGlow({
    color: OBSTACLE_RIM_COLOR,
    power: OBSTACLE_RIM_POWER,
    intensity: OBSTACLE_RIM_INTENSITY,
    atSilhouette: true,
  });

export interface ObstacleDisplayProps {
  obstacles: readonly Obstacle[];
}

export default function ObstacleDisplay({
  obstacles,
}: ObstacleDisplayProps): ReactNode {
  const coreRef = useRef<THREE.InstancedMesh>(null);
  const rimRef = useRef<THREE.InstancedMesh>(null);
  const [rimMaterial] = useState(createRimMaterial);
  const spin = useRef(0);

  useEffect(() => () => rimMaterial.dispose(), [rimMaterial]);

  useLayoutEffect(() => {
    const rim = rimRef.current;
    if (!rim) {
      return;
    }

    obstacles.forEach((obstacle, index) => {
      tempObject.position.copy(obstacle.position);
      tempObject.rotation.set(0, 0, 0);
      tempObject.updateMatrix();
      rim.setMatrixAt(index, tempObject.matrix);
    });

    rim.instanceMatrix.needsUpdate = true;
  }, [obstacles]);

  useFrame((_, delta) => {
    const core = coreRef.current;
    if (!core) {
      return;
    }

    spin.current += delta * OBSTACLE_SPIN_SPEED;
    obstacles.forEach((obstacle, index) => {
      tempObject.position.copy(obstacle.position);
      tempObject.rotation.set(
        spin.current * 0.6 + index,
        spin.current + index * 2,
        0,
      );
      tempObject.updateMatrix();
      core.setMatrixAt(index, tempObject.matrix);
    });

    core.instanceMatrix.needsUpdate = true;
  });

  if (obstacles.length === 0) {
    return null;
  }

  const { radius } = obstacles[0];

  return (
    <group name={GROUP_NAME}>
      <instancedMesh
        ref={coreRef}
        args={[undefined, undefined, obstacles.length]}
        castShadow
        receiveShadow
      >
        <icosahedronGeometry args={[radius, OBSTACLE_CORE_DETAIL]} />
        <meshStandardMaterial
          color={OBSTACLE_CORE_COLOR}
          roughness={0.35}
          metalness={0.5}
          emissive={OBSTACLE_RIM_COLOR}
          emissiveIntensity={0.18}
          flatShading
        />
      </instancedMesh>
      <instancedMesh
        ref={rimRef}
        args={[undefined, undefined, obstacles.length]}
      >
        <icosahedronGeometry
          args={[radius * OBSTACLE_RIM_SCALE, OBSTACLE_RIM_DETAIL]}
        />
        <primitive object={rimMaterial} attach="material" />
      </instancedMesh>
    </group>
  );
}
