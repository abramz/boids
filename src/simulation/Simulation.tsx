import * as THREE from "three";
import { ReactNode, Suspense, useLayoutEffect } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { OrbitControls, Stars } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { AlertContext } from "../hooks/alertContext";
import {
  BACKGROUND_COLOR,
  FOG_DENSITY,
  LIGHTS,
  STAR_COUNT,
  STAR_DEPTH,
  STAR_RADIUS,
  STAR_SIZE,
  STAR_SPEED,
  TONE_MAPPING_EXPOSURE,
} from "../theme";
import Sun from "./Sun";
import ErrorFallback from "./ErrorFallback";
import PauseWhenNotVisibile from "./PauseWhenNotVisibile";
import Instructions from "./Instructions";
import LoadingFallback from "./LoadingFallback";
import World from "./World";
import Stats from "./Stats";

/**
 * Set up the scene & world
 */
export default function Simulation({
  setAlertContents,
}: {
  setAlertContents: (content: ReactNode) => void;
}): ReactNode {
  const gl = useThree((state) => state.gl);

  useLayoutEffect(() => {
    /* three clips anything over 1 by default, which flattens every highlight */
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = TONE_MAPPING_EXPOSURE;

    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
  }, [gl]);

  return (
    <AlertContext.Provider value={{ setAlertContents }}>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <PauseWhenNotVisibile />
        <color attach="background" args={[BACKGROUND_COLOR]} />
        {/* fog and background share a colour so distance reads as depth rather
            than as haze laid over the scene */}
        <fogExp2 attach="fog" args={[BACKGROUND_COLOR, FOG_DENSITY]} />
        <Stars
          radius={STAR_RADIUS}
          depth={STAR_DEPTH}
          count={STAR_COUNT}
          factor={STAR_SIZE}
          saturation={0}
          speed={STAR_SPEED}
          fade
        />
        <Suspense fallback={<LoadingFallback />}>
          <ambientLight intensity={LIGHTS.ambientIntensity} />
          <hemisphereLight
            intensity={LIGHTS.skyIntensity}
            color={LIGHTS.skyColor}
            groundColor={BACKGROUND_COLOR}
          />
          <directionalLight
            position={LIGHTS.rimPosition}
            intensity={LIGHTS.rimIntensity}
            color={LIGHTS.rimColor}
          />
          <Sun />
          <Instructions />
          <World />
        </Suspense>
        <OrbitControls autoRotateSpeed={0.5} zoomSpeed={0.5} />
        <Stats />
      </ErrorBoundary>
    </AlertContext.Provider>
  );
}
