import { ReactNode, Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { OrbitControls, StatsGl } from "@react-three/drei";
import { AlertContext } from "../hooks/alertContext";
import ErrorFallback from "./ErrorFallback";
import PauseWhenNotVisibile from "./PauseWhenNotVisibile";
import Instructions from "./Instructions";
import LoadingFallback from "./LoadingFallback";
import World from "./World";

/**
 * Set up the scene & world
 */
export default function Simulation({
  setAlertContents,
}: {
  setAlertContents: (content: ReactNode) => void;
}): ReactNode {
  return (
    <AlertContext.Provider value={{ setAlertContents }}>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <PauseWhenNotVisibile />
        <Suspense fallback={<LoadingFallback />}>
          <hemisphereLight intensity={4} />
          <Instructions />
          <World />
        </Suspense>
        <OrbitControls autoRotateSpeed={0.5} zoomSpeed={0.5} />
        <StatsGl />
      </ErrorBoundary>
    </AlertContext.Provider>
  );
}
