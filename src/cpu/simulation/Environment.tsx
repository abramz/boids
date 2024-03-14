import * as THREE from "three";
import { ReactNode } from "react";
import { Helper } from "@react-three/drei";
import { OCT_TREE_BOUNDARY_SCALE, WORLD_SIZE } from "../config";
import useHelpers from "../hooks/useHelpers";

export interface EnvironmentProps {}

export default function Environment(): ReactNode {
  const { showWorldBoundary, showStorageBoundary } = useHelpers();

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
    </>
  );
}
