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

/**
 * The world the fastest machines earn, and with FLOCK_SIZE the thing that sets
 * how densely packed the flock is. A boid sees PERCEPTION_RADIUS around itself
 * whatever the world, so shrinking this packs its perception sphere and growing
 * it empties them, and the flock stops holding together at either end: too
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
 * How far a boid can see. This bounds the search for neighbours; NEIGHBOUR_LIMIT
 * bounds how many of them it actually flocks with. useWorldSize.ts holds the
 * flock's density fixed whatever the machine and leaves this alone, so flocking
 * behaves identically on any hardware.
 */
export const PERCEPTION_RADIUS = 3;

/**
 * How many neighbours a boid actually flocks with, nearest first, out of
 * whatever the perception radius turns up. The radius bounds the search; this
 * bounds the answer, so a boid in the thick of the flock steers by as firm a
 * consensus as one out on the edge of it, rather than by the mean of however
 * many happen to be in range. Starlings track about seven (Ballerini et al.,
 * 2008).
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
 * Buckets in the index's hash table, per boid.
 *
 * The world has no outer wall, so cells are hashed into a fixed table rather
 * than indexed in an array covering all of them, and two cells can share a
 * bucket. The index checks which cell a boid is really in, so a collision costs
 * a comparison rather than a wrong answer; this is what keeps them rare enough
 * not to matter.
 */
export const GRID_BUCKETS_PER_BOID = 4;

export const FIELD_OF_VIEW_DEG = 230;
export const DESIRED_SEPARATION = 1;
/**
 * The speed a boid cruises at, and the ceiling it can be pushed to.
 *
 * The floor is a backstop rather than the cruising speed itself: steering is a
 * force budget in units per second squared, so a boid turns at maxForce/speed
 * radians a second, and one allowed to drift towards a stop spins instead of
 * flying. ALIGNMENT_FACTOR is what keeps the force balance clear of the floor;
 * without it the two opposing flocking forces settle low enough that the
 * backstop becomes the speed model.
 */
export const MIN_SPEED = 4;
export const MAX_SPEED = 8;

/**
 * How hard a boid can steer, in world units per second squared. Both this and
 * MAX_SPEED are rates against the clock rather than per-frame budgets, so the
 * flock behaves the same however fast the machine draws it.
 */
export const MAX_FORCE = 24;

/**
 * Frame deltas above this are discarded rather than integrated. A boid covers
 * `MAX_SPEED * delta` in a frame, so a quarter second carries it most of a
 * perception radius: past that it arrives somewhere it never flew through,
 * having missed whatever it should have steered around on the way.
 */
export const MAX_DELTA = 0.25;

/**
 * Weighted above the other two because it is the only flocking force that does
 * not fight them: alignment steers towards where the neighbourhood is already
 * going, so it agrees with the boid's own heading, where cohesion pulls inward
 * and separation pushes out. At parity the three cancel and the flock settles
 * to a crawl, and a crawling boid, on the budget above, spins.
 */
export const ALIGNMENT_FACTOR = 3.0;
export const COHESION_FACTOR = 1.0;
export const SEPARATION_FACTOR = 1.0;
export const AVOID_EDGES_FACTOR = 50.0;
export const AVOID_OBSTACLES_FACTOR = 50.0;

/**
 * The leash, and the only force that is not tunable down to nothing.
 *
 * Edge avoidance is what turns a boid at a wall, and turning it off is a
 * reasonable thing to want to watch. Nothing else stops the flock leaving for
 * good, though, and the index has no outer wall to catch it at, so this is
 * weighted to be beaten by cohesion at about a world's width outside: far
 * enough out to be no part of how the flock flies, near enough that a flock
 * that has slipped its edges settles somewhere it can be seen and recovered
 * from rather than somewhere it cannot.
 */
export const DRAW_TO_CENTER_FACTOR = 1.0;

/** How light the draw to center is allowed to be made. */
export const MIN_DRAW_TO_CENTER_FACTOR = 0.1;
