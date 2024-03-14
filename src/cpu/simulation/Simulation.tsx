import { ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Canvas } from "@react-three/fiber";
import { WORLD_SIZE } from "../config";
import ErrorFallback from "./ErrorFallback";
import Environment from "./Environment";

export default function Simulation(): ReactNode {
  return (
    <Canvas
      gl={{ antialias: true, pixelRatio: window.devicePixelRatio }}
      camera={{
        position: [0, 0, WORLD_SIZE / 2],
        fov: 55,
        near: 0.1,
        far: 100,
      }}
    >
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Environment />
      </ErrorBoundary>
    </Canvas>
  );
}
