import * as THREE from "three";
import { WORLD_SIZE } from "./config";

/**
 * How the scene is dressed, kept apart from config.ts, which holds the numbers
 * the simulation itself runs on.
 *
 * Anything that has to cover the world takes its size as an argument.
 * config.WORLD_SIZE is only the world the fastest machines earn; useWorldSize.ts
 * has the one a given machine actually gets.
 *
 * The sky (the sun and the starfield) is the exception, and reads the largest
 * world on purpose: a backdrop has to sit beyond every machine's world, so it is
 * placed once against the biggest of them and left there. Its numbers are sized
 * off WORLD_SIZE itself, so retuning that moves the sky with it and the
 * starfield stays clear of the flock.
 */

/**
 * The scene clears to this and the fog converges on it. `--background` in
 * style.css is the same colour for the page around the canvas, and the two have
 * to be changed together.
 */
export const BACKGROUND_COLOR = 0x0a0f12;

/**
 * Exponential-squared fog density, so the far side of the world dims by about
 * as much whatever world the machine earned: hold a density fixed while the
 * world grows and the far side goes from distant to gone. The coefficient is
 * set against cameraDistance, since how much fog the flock picks up depends on
 * how far back the camera watches it from.
 */
export const fogDensity = (worldSize: number): number => 0.45 / worldSize;

/**
 * How far back the camera watches a world of this size from. A whole world size
 * out is clear of the boundary with the far wall still in frame, where half of
 * one puts the camera on the boundary face, inside the flock.
 */
export const cameraDistance = (worldSize: number): number => worldSize;

/**
 * Stated, though r3f happens to default to the same number: how much of the
 * flock lands in frame is this against `cameraDistance` and where the leash
 * settles the flock, and `src/__tests__/framing.test.ts` pins the three
 * together. three's own PerspectiveCamera default is 50, so an inherited value
 * here would be easy to mistake.
 */
export const CAMERA_FOV = 75;

/** ACES rolls highlights off rather than clipping them, so lights can exceed 1. */
export const TONE_MAPPING_EXPOSURE = 1.05;

export const SUN_COLOR = 0xfff0d4;

/** Beyond the world but inside the starfield, so stars fall behind it. */
const SUN_DISTANCE = WORLD_SIZE * 2;
/** High and to one side, so the light rakes across the flock. */
export const SUN_POSITION: THREE.Vector3Tuple = new THREE.Vector3(46, 68, 38)
  .normalize()
  .multiplyScalar(SUN_DISTANCE)
  .toArray();
/** Held to a constant angular size by scaling with the distance above. */
export const SUN_RADIUS = WORLD_SIZE * 0.09;
/** The corona is this many times the disc it wraps. */
export const SUN_CORONA_SCALE = 4;
export const SUN_CORONA_POWER = 2.5;
export const SUN_CORONA_INTENSITY = 1.4;

/**
 * The sun casts, and only the obstacles cast into it, so a modest map is sharp:
 * eight bodies a couple of units across get tens of texels each, where the
 * boids they fall on would have got about four.
 */
export const SHADOW_MAP_SIZE = 1024;

export interface ShadowFrustum {
  /** Half-width, out to the corners of the world cube. */
  extent: number;
  near: number;
  far: number;
}

/**
 * The orthographic frustum the sun casts through, bracketing the world as seen
 * from the sun and no more. Sized against the world so a machine that earns a
 * smaller one spends its whole shadow map on it.
 */
export function shadowFrustum(worldSize: number): ShadowFrustum {
  const extent = worldSize * 0.9;

  return {
    extent,
    near: Math.max(0.5, SUN_DISTANCE - extent),
    far: SUN_DISTANCE + extent,
  };
}

export const SHADOW_BIAS = -0.0005;
/** Offsets the lookup along the normal, which keeps facets acne-free. */
export const SHADOW_NORMAL_BIAS = 0.05;

/**
 * The sun is the key, thrown from behind the camera's starting position so it
 * lights the faces turned towards the viewer, with a cool rim from the opposite
 * side. Fill is the floor under both: too little and everything facing away
 * from the sun goes black, too much and the directional contrast that gives the
 * darts their shape washes out.
 */
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
/** Well outside the world, so the field parallaxes clear of it. */
export const STAR_RADIUS = WORLD_SIZE * 2.5;
export const STAR_DEPTH = WORLD_SIZE * 1.1;
/** drei scales a star down by its distance, and the field is a long way out. */
export const STAR_SIZE = 6;
/** drei breathes star size on a sine; slow enough here to barely shimmer. */
export const STAR_SPEED = 0.15;

/**
 * One hue per flock, matched on perceived luminance rather than on hex values.
 * Picking them by eye lands the yellows far brighter than the blues, and the
 * bright flock then reads as the foreground of every frame.
 */
export const FLOCK_COLORS = [0xe6725f, 0xbf8838, 0x5aa478, 0x5697c9, 0xa87fc4];

/**
 * Length of a dart, as a multiple of the simulation's boid size. Two, because
 * deriveBoidProperties.ts reads boid size as a radius, so a dart of twice that
 * reaches exactly as far from its own position as the maths assume it does.
 */
export const BOID_LENGTH_RATIO = 2;
/** Half-width of a dart, as a multiple of the same. Slender enough to fly. */
export const BOID_RADIUS_RATIO = 0.32;
/** Facets of the dart hull. Enough to shade around, few enough to still read as faceted. */
export const BOID_FACETS = 6;
/**
 * Flat emissive across the whole hull, in the flock's colour. The lights alone
 * leave the nose of a dart facing away from the sun too dark to pick out, and
 * this is the floor under that.
 */
export const BOID_EMISSIVE = 0.35;

/** Length of the thrust plume, as a multiple of the simulation's boid size. */
export const BOID_PLUME_LENGTH_RATIO = 1;
/** Width of the plume where it leaves the hull, as a fraction of the hull's. */
export const BOID_PLUME_RADIUS_RATIO = 0.8;
/** Brightness of the plume where it leaves the hull, falling to nothing at its tip. */
export const BOID_PLUME_INTENSITY = 1.3;
/** Higher powers pull the plume back towards the hull it trails from. */
export const BOID_PLUME_FALLOFF = 1.8;

export const OBSTACLE_CORE_COLOR = 0x1b3947;
export const OBSTACLE_RIM_COLOR = 0x28c4ff;
export const OBSTACLE_RIM_INTENSITY = 1.8;
/** Higher powers pull the rim tighter to the silhouette. */
export const OBSTACLE_RIM_POWER = 3;
/** A bare icosahedron, so the key light breaks across twenty faces. */
export const OBSTACLE_CORE_DETAIL = 0;
/** Subdivided until the glow shell reads as a halo. */
export const OBSTACLE_RIM_DETAIL = 3;
/**
 * The shell sits just clear of the faceted core, which puts it about where the
 * radius the boids actually steer around is.
 */
export const OBSTACLE_RIM_SCALE = 1.04;
/** Radians per second, slow enough that it reads as a drift. */
export const OBSTACLE_SPIN_SPEED = 0.06;
