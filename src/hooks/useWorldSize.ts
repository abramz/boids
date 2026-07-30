import * as THREE from "three";
import { useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { useDetectGPU } from "@react-three/drei";
import * as config from "../config";

export interface WorldSize {
  /** Boids in each of the FLOCK_COUNT flocks. */
  flockSize: number;
  /** Length of the world cube's side. */
  worldSize: number;
}

/**
 * How big a flock this machine can carry, and the world that holds it.
 *
 * The world tracks the cube root of the flock, because it is volume that holds
 * boids: scale its length with the count instead and a machine that earns a
 * quarter of them gets a sixty-fourth of the space, packing that quarter in at
 * sixteen times the density the full flock flies at.
 *
 * The simulation itself scales with neither. Holding the perception radius fixed
 * alongside the density is what keeps the neighbour count, and so the flocking,
 * identical on every machine: a weaker one gets a smaller world with fewer boids
 * that behave the same, rather than a differently tuned simulation.
 *
 * Everything sized against the world reads it from here rather than from
 * config.WORLD_SIZE, which is only the size the fastest machines earn.
 */
export default function useWorldSize(): WorldSize {
  const glContext = useThree((state) => state.gl.getContext());
  const gpuResult = useDetectGPU({ glContext });

  return useMemo(() => {
    /* detect-gpu only reports an fps for a GPU it recognised and benchmarked.
       Firefox behind resistFingerprinting, a blocklisted card and a failed
       lookup all arrive here with none, and a machine we know nothing about
       earns the smallest flock rather than the largest. */
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
