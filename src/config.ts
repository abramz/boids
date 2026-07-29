/** Boids per flock on a machine that benchmarks well enough to carry them all. */
export const FLOCK_SIZE = 2000;

/** Boids per flock on the weakest machine, so a slow GPU still gets a flock. */
export const MIN_FLOCK_SIZE = 500;

/**
 * The detect-gpu score at which a machine is taken to manage a full flock.
 * Its `fps` is a 1080p estimate, so mid-range discrete cards clear this and
 * integrated graphics land part way down.
 */
export const FULL_FLOCK_FPS = 120;

export const FLOCK_COUNT = 5;

export const WORLD_SIZE = 45;

/**
 * How far back the camera starts, as a multiple of the world size. A whole
 * world size out sits clear of the boundary with the far wall still in frame,
 * where half of one put the camera on the boundary face, inside the flock.
 */
export const CAMERA_DISTANCE_SCALE = 1;

export const OCT_TREE_CAPACITY = 8;

export const OCT_TREE_BOUNDARY_SCALE = WORLD_SIZE * 0.3;

export const BOID_SIZE = 0.2;

/**
 * Obstacles sit on a 2x2x2 lattice, this far along each axis as a fraction of
 * the world's half extent.
 */
export const OBSTACLE_OFFSET = 0.5;

/** Obstacle radius as a fraction of the world size. */
export const OBSTACLE_RADIUS_SCALE = 1 / 24;

/**
 * Neighbours are found within this radius, so it sets how many boids each one
 * actually flocks with. World.tsx holds the flock's density fixed whatever the
 * machine and leaves this alone, so it lands on the same neighbour count
 * everywhere and the flocking behaves identically on any hardware.
 */
export const PERCEPTION_RADIUS = 3;
export const FIELD_OF_VIEW_DEG = 230;
export const DESIRED_SEPARATION = 1;
export const MAX_SPEED = 10;
export const MAX_FORCE = 0.8;

export const ALIGNMENT_FACTOR = 1.0;
export const COHESION_FACTOR = 1.0;
export const SEPARATION_FACTOR = 1.0;
export const AVOID_EDGES_FACTOR = 50.0;
