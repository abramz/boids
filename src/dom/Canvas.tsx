import * as THREE from "three";
import { createRoot, events } from "@react-three/fiber";
import { ReactNode, Suspense, lazy, useEffect, useRef, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { AlertContext } from "../hooks/alertContext";
import { WORLD_SIZE } from "../config";
import { CAMERA_FOV, TONE_MAPPING_EXPOSURE, cameraDistance } from "../theme";
import ErrorFallback from "../simulation/ErrorFallback";

const Simulation = lazy(() => import("../simulation/Simulation"));
const UI = lazy(() => import("./UI"));

/**
 * Every renderer setting the app depends on, in one place.
 *
 * It has to be one place: r3f applies its own defaults for everything left out
 * of a `configure` call, and the resize handler below configures again on every
 * resize. A setting parked in a one-shot effect instead survives or does not
 * depending on which of those defaults r3f happens to reapply, so the rule is
 * that it lives here.
 *
 * `percentage` is three's PCFShadowMap. The softer variant is deprecated in
 * r185 and silently falls back to this one anyway, with a console warning.
 */
const RENDERER_CONFIG = {
  events,
  shadows: "percentage",
  gl: {
    /* three clips anything over 1 by default, which flattens every highlight */
    toneMapping: THREE.ACESFilmicToneMapping,
    toneMappingExposure: TONE_MAPPING_EXPOSURE,
  },
} as const;

/**
 * The near plane, which the depth buffer's precision is far more sensitive to
 * than the far plane's. Nothing in the scene comes closer to the camera than a
 * boid, and pulling this in further only spends the precision the boids need to
 * decide which of them is in front.
 */
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
    root.configure({
      ...RENDERER_CONFIG,
      // set up once and then owned by OrbitControls, so it is deliberately not
      // part of what the resize handler re-applies
      camera: {
        fov: CAMERA_FOV,
        near: CAMERA_NEAR,
        /* how big a world this machine earns is not known until detect-gpu has
           run inside the tree, so start on the largest one; World pulls the
           camera in to the world it actually built */
        position: [0, 0, cameraDistance(WORLD_SIZE)],
      },
    });

    // the canvas will be resized for us as long as we call configure
    const listener = () => root.configure(RENDERER_CONFIG);
    window.addEventListener("resize", listener);
    listener();

    /* the boundaries wrap the lazy chunk rather than sitting inside it: a
       chunk that fails to load, which is what a stale deploy looks like,
       cannot be caught by an error boundary it was going to contain */
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
      {/* the role belongs to whatever is showing: loading is a status, an error
          is an alert, and the instructions are neither */}
      {alertContents ? <div className="alert">{alertContents}</div> : null}
      <Suspense fallback={null}>
        <UI />
      </Suspense>
    </>
  );
}
