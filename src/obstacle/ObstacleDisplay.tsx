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

/** A rim on the silhouette, which is what gives a dark body an edge to read. */
const createRimMaterial = () =>
  createFacingGlow({
    color: OBSTACLE_RIM_COLOR,
    power: OBSTACLE_RIM_POWER,
    intensity: OBSTACLE_RIM_INTENSITY,
    atSilhouette: true,
  });

export interface ObstacleDisplayProps {
  obstacles: Obstacle[];
}

export default function ObstacleDisplay({
  obstacles,
}: ObstacleDisplayProps): ReactNode {
  const coreRef = useRef<THREE.InstancedMesh>(null);
  const rimRef = useRef<THREE.InstancedMesh>(null);
  const [rimMaterial] = useState(createRimMaterial);
  const spin = useRef(0);

  useEffect(() => () => rimMaterial.dispose(), [rimMaterial]);

  /* the shell is a sphere, so spinning it would not show; place it once */
  useLayoutEffect(() => {
    if (rimRef.current) {
      obstacles.forEach((obstacle, i) => {
        tempObject.position.copy(obstacle.position);
        tempObject.rotation.set(0, 0, 0);
        tempObject.updateMatrix();
        rimRef.current!.setMatrixAt(i, tempObject.matrix);
      });

      rimRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [obstacles]);

  useFrame((_, delta) => {
    if (!coreRef.current) {
      return;
    }

    spin.current += delta * OBSTACLE_SPIN_SPEED;
    obstacles.forEach((obstacle, i) => {
      tempObject.position.copy(obstacle.position);
      /* offset each obstacle so the cluster does not turn as one piece */
      tempObject.rotation.set(spin.current * 0.6 + i, spin.current + i * 2, 0);
      tempObject.updateMatrix();
      coreRef.current!.setMatrixAt(i, tempObject.matrix);
    });

    coreRef.current.instanceMatrix.needsUpdate = true;
  });

  if (obstacles.length === 0) {
    return null;
  }

  /* kludge but they are all the same radius */
  const { radius } = obstacles[0];

  return (
    <group name={GROUP_NAME}>
      <instancedMesh
        ref={coreRef}
        args={[undefined, undefined, obstacles.length]}
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
