import * as THREE from "three";
import { createRoot, events } from "@react-three/fiber";
import { ReactNode, Suspense, lazy, useEffect, useRef, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { AlertContext } from "../hooks/alertContext";
import { WORLD_SIZE } from "../config";
import { CAMERA_FOV, TONE_MAPPING_EXPOSURE, cameraDistance } from "../theme";
import ErrorFallback from "../simulation/ErrorFallback";
import ErrorPanel from "../simulation/ErrorPanel";

const Simulation = lazy(() => import("../simulation/Simulation"));
const UI = lazy(() => import("./UI"));

const RENDERER_CONFIG = {
  events,
  shadows: "percentage",
  gl: {
    toneMapping: THREE.ACESFilmicToneMapping,
    toneMappingExposure: TONE_MAPPING_EXPOSURE,
  },
} as const;

const CAMERA_NEAR = 0.1;

export default function Canvas(): ReactNode {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [alertContents, setAlertContents] = useState<ReactNode | undefined>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const root = createRoot(canvas);

    const reportFailure = (error: unknown) =>
      setAlertContents(<ErrorPanel error={error} />);

    root
      .configure({
        ...RENDERER_CONFIG,
        camera: {
          fov: CAMERA_FOV,
          near: CAMERA_NEAR,
          position: [0, 0, cameraDistance(WORLD_SIZE)],
        },
      })
      .catch(reportFailure);

    const listener = () => {
      root.configure(RENDERER_CONFIG).catch(reportFailure);
    };
    window.addEventListener("resize", listener);
    listener();

    root.render(
      <AlertContext.Provider value={{ setAlertContents }}>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Suspense fallback={null}>
            <Simulation />
          </Suspense>
        </ErrorBoundary>
      </AlertContext.Provider>,
    );

    return () => {
      window.removeEventListener("resize", listener);
      root.unmount();
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef}>
        {"Canvas is not supported by this browser"}
      </canvas>
      {alertContents ? <div className="alert">{alertContents}</div> : null}
      <ErrorBoundary FallbackComponent={ErrorPanel}>
        <Suspense fallback={null}>
          <UI />
        </Suspense>
      </ErrorBoundary>
    </>
  );
}
