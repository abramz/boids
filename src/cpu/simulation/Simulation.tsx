import * as THREE from "three";
import { ReactNode, Suspense, useMemo } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { OrbitControls } from "@react-three/drei";
import { AlertContext } from "../hooks/alertContext";
import useBoidProperties from "../hooks/useBoidProperties";
import useForceFactors from "../hooks/useForceFactors";
import * as config from "../config";
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
    const halfSize = config.WORLD_SIZE / 2;

    return new THREE.Box3(
      new THREE.Vector3(-halfSize, -halfSize, -halfSize),
      new THREE.Vector3(halfSize, halfSize, halfSize),
    );
  }, []);
  const boidProperties = useBoidProperties({
    perceptionRadius: config.PERCEPTION_RADIUS,
    fieldOfViewDeg: config.FIELD_OF_VIEW_DEG,
    desiredSeparation: config.DESIRED_SEPARATION,
    maxSpeed: config.MAX_SPEED,
    maxForce: config.MAX_FORCE,
    boidSize: config.BOID_SIZE,
  });
  const forceFactors = useForceFactors({
    alignmentFactor: config.ALIGNMENT_FACTOR,
    cohesionFactor: config.COHESION_FACTOR,
    separationFactor: config.SEPARATION_FACTOR,
    avoidanceFactor: config.AVOIDANCE_FACTOR,
    seekFactor: config.SEEK_FACTOR,
    avoidEdgesFactor: config.AVOID_EDGES_FACTOR,
  });

  return (
    <AlertContext.Provider value={{ setAlertContents }}>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Performance>
          <Suspense fallback={<LoadingFallback />}>
            <hemisphereLight intensity={4} />
            <Instructions />
            <World
              flockSize={config.FLOCK_SIZE}
              flockCount={config.FLOCK_COUNT}
              boidProperties={boidProperties}
              forceFactors={forceFactors}
              worldBoundary={worldBoundary}
            />
          </Suspense>
          <OrbitControls autoRotateSpeed={0.5} zoomSpeed={0.5} />
        </Performance>
      </ErrorBoundary>
    </AlertContext.Provider>
  );
}
