import { ReactNode, Suspense } from "react";
import { OrbitControls, Stars } from "@react-three/drei";
import {
  BACKGROUND_COLOR,
  LIGHTS,
  STAR_COUNT,
  STAR_DEPTH,
  STAR_RADIUS,
  STAR_SIZE,
  STAR_SPEED,
} from "../theme";
import Fog from "./Fog";
import Sun from "./Sun";
import PauseWhenNotVisible from "./PauseWhenNotVisible";
import Instructions from "./Instructions";
import LoadingFallback from "./LoadingFallback";
import World from "./World";
import Stats from "./Stats";

export default function Simulation(): ReactNode {
  return (
    <>
      <PauseWhenNotVisible />
      <color attach="background" args={[BACKGROUND_COLOR]} />
      <Suspense fallback={null}>
        <Fog />
      </Suspense>
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
      <OrbitControls zoomSpeed={0.5} />
      <Stats />
    </>
  );
}
