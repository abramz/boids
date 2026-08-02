import * as THREE from "three";
import Candidates from "./Candidates";
import HashGrid from "./HashGrid";
import type Boid from "../behavior/Boid";
import type Obstacle from "../obstacle/Obstacle";

/**
 * The flock and the spatial index over it, kept in step with each other.
 */
export default class BoidStore {
  protected insertedIds = new Set<string>();
  protected boidsList: Boid[] = [];
  protected obstacleList: Obstacle[] = [];
  protected grid: HashGrid<Boid>;

  constructor(grid: HashGrid<Boid>) {
    this.grid = grid;
  }

  /**
   * Add a boid to the store. The index is built in one pass over the whole
   * flock rather than a boid at a time, so this one is not visible to
   * `queryRange` until the next `reindex`.
   */
  public insert(boid: Boid): void {
    if (this.insertedIds.has(boid.compoundId)) {
      throw new Error(`boid already inserted, ${boid.compoundId}`);
    }

    this.insertedIds.add(boid.compoundId);
    this.boidsList.push(boid);
  }

  /**
   * Rebuild the index around where the boids are now. The flock itself is
   * untouched: the same boid objects frame after frame, only the positions the
   * index holds them by have moved on.
   */
  public reindex(): void {
    this.grid.build(this.boidsList);
  }

  public insertObstacle(obstacle: Obstacle): void {
    this.obstacleList.push(obstacle);
  }

  /** Every boid within `range`, collected into `out`, which is reset first. */
  public queryRange(
    range: THREE.Sphere,
    /* OUT */ out: Candidates<Boid>,
  ): void {
    this.grid.queryRange(range, out);
  }

  /**
   * Every boid in the store, in insertion order. The array is the store's own
   * and holds its identity across `reindex`, so a renderer can hang memoisation
   * off it. Read it, don't write to it.
   */
  public get boids(): readonly Boid[] {
    return this.boidsList;
  }

  /** Every obstacle in the store. Read it, don't write to it. */
  public get obstacles(): readonly Obstacle[] {
    return this.obstacleList;
  }

  /** The cells of the index the flock actually occupies. */
  public cellBoundaries(): THREE.Box3[] {
    return this.grid.occupiedCells();
  }
}
