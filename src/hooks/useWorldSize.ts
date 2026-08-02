import * as THREE from "three";
import { useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { useDetectGPU } from "@react-three/drei";
import * as config from "../config";

export interface WorldSize {
  flockSize: number;
  worldSize: number;
}

export default function useWorldSize(): WorldSize {
  const glContext = useThree((state) => state.gl.getContext());
  const gpuResult = useDetectGPU({ glContext });

  return useMemo(() => {
    const capability = THREE.MathUtils.clamp(
      (gpuResult.fps ?? 0) / config.FULL_FLOCK_FPS,
      0,
      1,
    );
    const flockSize = Math.round(
      THREE.MathUtils.lerp(
        config.MIN_FLOCK_SIZE,
        config.FLOCK_SIZE,
        capability,
      ),
    );

    return {
      flockSize,
      worldSize: config.WORLD_SIZE * Math.cbrt(flockSize / config.FLOCK_SIZE),
    };
  }, [gpuResult]);
}
