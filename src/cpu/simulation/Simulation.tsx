import * as THREE from "three";
import { ReactNode, Suspense, useMemo } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { OrbitControls } from "@react-three/drei";
import { WORLD_SIZE } from "../config";
import { AlertContext } from "../hooks/alertContext";
import ErrorFallback from "./ErrorFallback";
import Performance from "./Performance";
import World from "./World";
import Instructions from "./Instructions";
import LoadingFallback from "./LoadingFallback";

/**
 * Set up the scene & world
 */
export default function Simulation({
  setAlertContents,
}: {
  setAlertContents: (content: ReactNode) => void;
}): ReactNode {
  const worldBoundary = useMemo(() => {
    const halfSize = WORLD_SIZE / 2;

    return new THREE.Box3(
      new THREE.Vector3(-halfSize, -halfSize, -halfSize),
      new THREE.Vector3(halfSize, halfSize, halfSize),
    );
  }, []);

  return (
    <AlertContext.Provider value={{ setAlertContents }}>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Performance>
          <Suspense fallback={<LoadingFallback />}>
            <hemisphereLight intensity={4} />
            <Instructions />
            <World worldBoundary={worldBoundary} />
          </Suspense>
          <OrbitControls autoRotateSpeed={0.5} zoomSpeed={0.5} />
        </Performance>
      </ErrorBoundary>
    </AlertContext.Provider>
  );
}
