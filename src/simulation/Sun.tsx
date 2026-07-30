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

/**
 * The key light and the thing it comes from, kept together so the two cannot
 * drift apart.
 *
 * The disc sits well beyond the world and opts out of the fog, which at this
 * range would otherwise erase it completely, so orbiting far enough round finds
 * a sun rather than an empty sky.
 */
export default function Sun(): ReactNode {
  const light = useRef<THREE.DirectionalLight>(null!);
  const { worldSize } = useWorldSize();
  /* graded like the disc it wraps: tone map one and not the other and the seam
     between them moves with the exposure */
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

  /* three reads the shadow camera's projection as it stands, so the frustum has
     to be recomputed once it has been sized to the world */
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
