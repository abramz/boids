import * as THREE from "three";
import { WORLD_SIZE } from "./config";

/**
 * How the scene is dressed, kept apart from config.ts, which holds the numbers
 * the simulation itself runs on.
 */

/** The scene clears to this and the fog converges on it. */
export const BACKGROUND_COLOR = 0x0a0f12;

/**
 * Exponential-squared fog density. Derived from WORLD_SIZE so the far side of
 * the world always dims by about as much: hold it fixed while the world grows
 * and the far side goes from distant to gone. The coefficient is set against
 * CAMERA_DISTANCE_SCALE, since how much fog the flock picks up depends on how
 * far back the camera watches it from.
 */
export const FOG_DENSITY = 0.45 / WORLD_SIZE;

/** ACES rolls highlights off rather than clipping them, so lights can exceed 1. */
export const TONE_MAPPING_EXPOSURE = 1.05;

export const SUN_COLOR = 0xfff0d4;
/** Beyond the world but inside the starfield, so stars fall behind it. */
export const SUN_POSITION: THREE.Vector3Tuple = [46, 68, 38];
export const SUN_RADIUS = 4;
/** The corona is this many times the disc it wraps. */
export const SUN_CORONA_SCALE = 4;
export const SUN_CORONA_POWER = 2.5;
export const SUN_CORONA_INTENSITY = 1.4;

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
/** Well outside the world, so the field parallaxes rather than intersecting it. */
export const STAR_RADIUS = 110;
export const STAR_DEPTH = 50;
/** drei scales a star by this over its distance, and 110 units away is a long way. */
export const STAR_SIZE = 6;
/** drei breathes star size on a sine; slow it to a drift rather than a twinkle. */
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
/** Subdivided until the glow shell reads as a halo rather than a polygon. */
export const OBSTACLE_RIM_DETAIL = 3;
/**
 * The shell sits just clear of the faceted core, which puts it about where the
 * radius the boids actually steer around is.
 */
export const OBSTACLE_RIM_SCALE = 1.04;
/** Radians per second, slow enough to read as drift rather than motion. */
export const OBSTACLE_SPIN_SPEED = 0.06;
