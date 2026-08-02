import * as THREE from "three";
import { WORLD_SIZE } from "./config";

export const BACKGROUND_COLOR = 0x0a0f12;

export const fogDensity = (worldSize: number): number => 0.45 / worldSize;

export const cameraDistance = (worldSize: number): number => worldSize;

export const CAMERA_FOV = 75;

export const TONE_MAPPING_EXPOSURE = 1.05;

export const SUN_COLOR = 0xfff0d4;

const SUN_DISTANCE = WORLD_SIZE * 2;
export const SUN_POSITION: THREE.Vector3Tuple = new THREE.Vector3(46, 68, 38)
  .normalize()
  .multiplyScalar(SUN_DISTANCE)
  .toArray();
export const SUN_RADIUS = WORLD_SIZE * 0.09;
export const SUN_CORONA_SCALE = 4;
export const SUN_CORONA_POWER = 2.5;
export const SUN_CORONA_INTENSITY = 1.4;

export const SHADOW_MAP_SIZE = 1024;

export interface ShadowFrustum {
  extent: number;
  near: number;
  far: number;
}

export function shadowFrustum(worldSize: number): ShadowFrustum {
  const extent = worldSize * 0.9;

  return {
    extent,
    near: Math.max(0.5, SUN_DISTANCE - extent),
    far: SUN_DISTANCE + extent,
  };
}

export const SHADOW_BIAS = -0.0005;
export const SHADOW_NORMAL_BIAS = 0.05;

export const LIGHTS = {
  ambientIntensity: 0.45,
  skyIntensity: 0.7,
  skyColor: 0x9fc6ff,
  sunIntensity: 2.6,
  rimIntensity: 1.6,
  rimColor: 0x4fa8ff,
  rimPosition: [-14, -8, -12] as THREE.Vector3Tuple,
};

export const STAR_COUNT = 1800;
export const STAR_RADIUS = WORLD_SIZE * 2.5;
export const STAR_DEPTH = WORLD_SIZE * 1.1;
export const STAR_SIZE = 6;
export const STAR_SPEED = 0.15;

export const FLOCK_COLORS = [0xe6725f, 0xbf8838, 0x5aa478, 0x5697c9, 0xa87fc4];

export const BOID_LENGTH_RATIO = 2;
export const BOID_RADIUS_RATIO = 0.32;
export const BOID_FACETS = 6;
export const BOID_EMISSIVE = 0.35;

export const BOID_PLUME_LENGTH_RATIO = 1;
export const BOID_PLUME_RADIUS_RATIO = 0.8;
export const BOID_PLUME_INTENSITY = 1.3;
export const BOID_PLUME_FALLOFF = 1.8;

export const OBSTACLE_CORE_COLOR = 0x1b3947;
export const OBSTACLE_RIM_COLOR = 0x28c4ff;
export const OBSTACLE_RIM_INTENSITY = 1.8;
export const OBSTACLE_RIM_POWER = 3;
export const OBSTACLE_CORE_DETAIL = 0;
export const OBSTACLE_RIM_DETAIL = 3;
export const OBSTACLE_RIM_SCALE = 1.04;
export const OBSTACLE_SPIN_SPEED = 0.06;
