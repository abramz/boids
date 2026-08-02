/** Boids per flock on a machine that benchmarks well enough to carry them all. */
export const FLOCK_SIZE = 2000;

/** Boids per flock on the weakest machine, so a slow GPU still gets a flock. */
export const MIN_FLOCK_SIZE = 500;

/**
 * The detect-gpu score at which a machine is taken to manage a full flock. Its
 * `fps` is a 1080p estimate, so mid-range discrete cards clear this.
 */
export const FULL_FLOCK_FPS = 120;

export const FLOCK_COUNT = 5;

/**
 * The world the fastest machines earn, and with FLOCK_SIZE what sets how
 * densely packed the flock is. A boid sees PERCEPTION_RADIUS around itself
 * whatever the world, so the flock stops holding together at either end: too
 * crowded and separation is all any boid is doing, too sparse and there is
 * nobody in range to do it with.
 */
export const WORLD_SIZE = 75;

export const BOID_SIZE = 0.2;

/**
 * Obstacles sit on a 2x2x2 lattice, this far along each axis as a fraction of
 * the world's half extent.
 */
export const OBSTACLE_OFFSET = 0.5;

/** Obstacle radius as a fraction of the world size. */
export const OBSTACLE_RADIUS_SCALE = 1 / 24;

/**
 * How far a boid can see. This bounds the search for neighbours;
 * NEIGHBOUR_LIMIT bounds how many of them it actually flocks with.
 */
export const PERCEPTION_RADIUS = 3;

/**
 * How many neighbours a boid flocks with, nearest first. The radius bounds the
 * search, this bounds the answer, so a boid in the thick of the flock steers by
 * as firm a consensus as one out on the edge of it. Starlings track about seven
 * (Ballerini et al., 2008).
 */
export const NEIGHBOUR_LIMIT = 8;

/**
 * The side of one cell of the spatial index.
 *
 * A query walks the block of cells its radius reaches into, so the cheapest
 * cell is one the size of the radius actually asked for: smaller and the block
 * grows, larger and each cell hands back more to test. That radius is the one
 * `deriveBoidProperties.queriedRadius` computes, restated here rather than
 * imported so this module stays a leaf; `config.test.ts` pins the two together.
 */
export const GRID_CELL_SIZE = PERCEPTION_RADIUS + BOID_SIZE;

/**
 * Buckets in the index's hash table, per boid. The world has no outer wall, so
 * cells are hashed into a fixed table and two of them can share a bucket.
 *
 * What the table holds is occupied cells rather than boids, and a cell is a
 * whole queried radius across, so the flock is the loose upper bound on how
 * many there can be: sizing against it holds the load factor under a quarter
 * however the flock happens to be spread.
 */
export const GRID_BUCKETS_PER_BOID = 4;

export const FIELD_OF_VIEW_DEG = 230;
export const DESIRED_SEPARATION = 1;

/**
 * The speed a boid cruises at, and the ceiling it can be pushed to.
 *
 * The floor is a backstop rather than the cruising speed: steering is a force
 * budget in units per second squared, so a boid turns at maxForce/speed radians
 * a second and one allowed to drift towards a stop spins instead of flying.
 * ALIGNMENT_FACTOR is what keeps the balance clear of the floor.
 */
export const MIN_SPEED = 4;
export const MAX_SPEED = 8;

/**
 * How hard a boid can steer, in world units per second squared. A rate against
 * the clock rather than a per-frame budget, so the flock behaves the same
 * however fast the machine draws it.
 */
export const MAX_FORCE = 24;

/**
 * Frame deltas above this are discarded rather than integrated. A boid covers
 * `MAX_SPEED * delta` in a frame, so past a quarter second it arrives somewhere
 * it never flew through, having missed whatever was on the way.
 */
export const MAX_DELTA = 0.25;

/**
 * Weighted well above the other two because it is the only flocking force that
 * does not fight them: alignment agrees with the boid's own heading, where
 * cohesion pulls inward and separation pushes out. At parity the three cancel
 * and the flock settles to a crawl, and a crawling boid spins.
 */
export const ALIGNMENT_FACTOR = 7.0;
export const COHESION_FACTOR = 1.0;

/**
 * Weighted above cohesion because the two are not asked equally often: cohesion
 * answers whenever a flockmate is in view, separation only for the ones already
 * inside the spacing it wants. At parity the flock packs in tighter than that.
 */
export const SEPARATION_FACTOR = 2.0;

/**
 * Off, so the world is somewhere the flock is kept near rather than a box it is
 * turned back at. Wound up, this is a hard wall on each of three axes and a
 * flock that meets one flattens along it and turns as a sheet.
 */
export const AVOID_EDGES_FACTOR = 0.0;
export const AVOID_OBSTACLES_FACTOR = 50.0;

/**
 * The leash, and the only force that is not tunable down to nothing.
 *
 * With edge avoidance off this is the whole of what keeps the flock about the
 * world, and the index has no outer wall to catch it at. Weighted to be beaten
 * by cohesion until about a world's width outside; past that it grows with the
 * distance strayed until it is what the summed forces point along, which is all
 * it has to win, since the total is capped at MAX_FORCE either way.
 *
 * Where the flock settles is emergent from this against COHESION_FACTOR, and it
 * is well outside the world box. `shippedConfig.test.ts` bounds it.
 */
export const DRAW_TO_CENTER_FACTOR = 1.0;

/**
 * How light the draw to center is allowed to be made. The floor is on the
 * control that tunes it, in useForceFactors.ts, rather than on the force, which
 * is what lets a test turn it off to isolate the rest.
 *
 * It buys a bound rather than a framing: here the flock settles further out
 * than the camera is sized for, which a viewer can pull back from, and what
 * `shippedConfig.test.ts` holds is that it settles at all.
 */
export const MIN_DRAW_TO_CENTER_FACTOR = 0.1;
