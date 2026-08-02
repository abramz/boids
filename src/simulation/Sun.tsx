import * as THREE from "three";
import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import createFacingGlow from "../helpers/facingGlow";
import {
  LIGHTS,
  SHADOW_BIAS,
  SHADOW_MAP_SIZE,
  SHADOW_NORMAL_BIAS,
  SUN_COLOR,
  SUN_CORONA_INTENSITY,
  SUN_CORONA_POWER,
  SUN_CORONA_SCALE,
  SUN_POSITION,
  SUN_RADIUS,
  shadowFrustum,
} from "../theme";
import useWorldSize from "../hooks/useWorldSize";

export const GROUP_NAME = "Sun";

export default function Sun(): ReactNode {
  const light = useRef<THREE.DirectionalLight>(null!);
  const { worldSize } = useWorldSize();
  const [corona] = useState(() =>
    createFacingGlow({
      color: SUN_COLOR,
      power: SUN_CORONA_POWER,
      intensity: SUN_CORONA_INTENSITY,
      fog: false,
      toneMapped: false,
    }),
  );

  useEffect(() => () => corona.dispose(), [corona]);

  useLayoutEffect(() => {
    const { camera } = light.current.shadow;
    const { extent, near, far } = shadowFrustum(worldSize);

    camera.left = -extent;
    camera.right = extent;
    camera.top = extent;
    camera.bottom = -extent;
    camera.near = near;
    camera.far = far;
    camera.updateProjectionMatrix();
  }, [worldSize]);

  return (
    <>
      <directionalLight
        ref={light}
        position={SUN_POSITION}
        intensity={LIGHTS.sunIntensity}
        color={SUN_COLOR}
        castShadow
        shadow-mapSize-width={SHADOW_MAP_SIZE}
        shadow-mapSize-height={SHADOW_MAP_SIZE}
        shadow-bias={SHADOW_BIAS}
        shadow-normalBias={SHADOW_NORMAL_BIAS}
      />
      <group name={GROUP_NAME} position={SUN_POSITION}>
        <mesh>
          <sphereGeometry args={[SUN_RADIUS, 32, 16]} />
          <meshBasicMaterial color={SUN_COLOR} toneMapped={false} fog={false} />
        </mesh>
        <mesh>
          <sphereGeometry args={[SUN_RADIUS * SUN_CORONA_SCALE, 32, 16]} />
          <primitive object={corona} attach="material" />
        </mesh>
      </group>
    </>
  );
}
