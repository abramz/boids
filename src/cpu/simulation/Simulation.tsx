import * as THREE from "three";
import { ReactNode, useMemo } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { WORLD_SIZE } from "../config";
import ErrorFallback from "./ErrorFallback";
import Performance from "./Performance";
import World from "./World";
import Instructions from "./Instructions";

/**
 * Set up the scene & world
 */
export default function Simulation(): ReactNode {
  const worldBoundary = useMemo(() => {
    const halfSize = WORLD_SIZE / 2;

    return new THREE.Box3(
      new THREE.Vector3(-halfSize, -halfSize, -halfSize),
      new THREE.Vector3(halfSize, halfSize, halfSize),
    );
  }, []);

  return (
    <Canvas
      gl={{ antialias: true, pixelRatio: window.devicePixelRatio }}
      camera={{
        position: [0, 0, WORLD_SIZE / 2],
        fov: 55,
        near: 0.1,
        far: 1000,
      }}
    >
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Performance>
          <hemisphereLight intensity={4} />
          <Instructions />
          <World worldBoundary={worldBoundary} />
          <OrbitControls autoRotateSpeed={0.5} zoomSpeed={0.5} />
        </Performance>
      </ErrorBoundary>
    </Canvas>
  );
}
