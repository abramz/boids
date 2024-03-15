import * as THREE from "three";
import { ReactNode, useMemo } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Canvas as ThreeCanvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { WORLD_SIZE } from "../config";
import ErrorFallback from "./ErrorFallback";
import Performance from "./Performance";
import Simulation from "./Simulation";

export default function Canvas(): ReactNode {
  const worldBoundary = useMemo(() => {
    const halfSize = WORLD_SIZE / 2;

    return new THREE.Box3(
      new THREE.Vector3(-halfSize, -halfSize, -halfSize),
      new THREE.Vector3(halfSize, halfSize, halfSize),
    );
  }, []);

  return (
    <ThreeCanvas
      gl={{ antialias: true, pixelRatio: window.devicePixelRatio }}
      camera={{
        position: [0, 0, WORLD_SIZE + 2],
        fov: 55,
        near: 0.1,
        far: 1000,
      }}
    >
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Performance>
          <Simulation worldBoundary={worldBoundary} />
          <OrbitControls autoRotateSpeed={0.5} zoomSpeed={0.5} />
        </Performance>
      </ErrorBoundary>
    </ThreeCanvas>
  );
}
