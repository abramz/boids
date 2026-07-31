import * as THREE from "three";
import Candidates from "./Candidates";
import OctTree from "./OctTree";
import type Boid from "../behavior/Boid";
import type Obstacle from "../obstacle/Obstacle";

/**
 * The flock and the spatial index over it, kept in step with each other.
 */
export default class BoidStore {
  protected insertedIds = new Set<string>();
  protected boidsList: Boid[] = [];
  protected obstacleList: Obstacle[] = [];
  protected octTree: OctTree<Boid>;

  constructor(octTree: OctTree<Boid>) {
    this.octTree = octTree;
  }

  /**
   * Add a boid to the store and to the underlying OctTree
   * @param boid the boid to insert
   */
  public insert(boid: Boid): void {
    if (this.insertedIds.has(boid.compoundId)) {
      throw new Error(`boid already inserted, ${boid.compoundId}`);
    }

    if (!this.octTree.insert(boid)) {
      throw new Error(`boid unable to be inserted, ${boid.compoundId}`);
    }

    this.insertedIds.add(boid.compoundId);
    this.boidsList.push(boid);
  }

  /**
   * Rebuild the OctTree around where the boids are now.
   *
   * The flock itself is untouched: these are the same boid objects frame after
   * frame, and only the positions the tree indexes them by have moved on.
   *
   * Throws if a boid has ended up outside the tree, before anything is torn
   * down, so the index a caller abandons the frame on is the intact one it came
   * in with rather than a partial rebuild. Callers are expected to have kept
   * every position inside `boundary`, so this is a failure to abandon the frame
   * on rather than one to carry on from.
   */
  public reindex(): void {
    const stray = this.boidsList.find(
      (boid) => !this.octTree.boundary.containsPoint(boid.position),
    );
    if (stray) {
      throw new Error(`boid outside the storage boundary, ${stray.compoundId}`);
    }

    this.octTree.clear();
    for (const boid of this.boidsList) {
      this.octTree.insert(boid);
    }
  }

  public insertObstacle(obstacle: Obstacle): void {
    this.obstacleList.push(obstacle);
  }

  /**
   * Every boid within `range`, collected into `out`, which is reset first.
   */
  public queryRange(
    range: THREE.Sphere,
    /* OUT */ out: Candidates<Boid>,
  ): void {
    this.octTree.queryRange(range, out);
  }

  /**
   * Every boid in the store, in the order they were inserted.
   *
   * The array is the store's own and holds its identity across `reindex`, so a
   * renderer can hang memoisation off it. Read it, don't write to it.
   */
  public get boids(): readonly Boid[] {
    return this.boidsList;
  }

  /** Every obstacle in the store. Read it, don't write to it. */
  public get obstacles(): readonly Obstacle[] {
    return this.obstacleList;
  }

  /**
   * Get all the boundaries of the underlying OctTree
   */
  public get boundaries(): THREE.Box3[] {
    return this.octTree.boundaries;
  }

  /**
   * The outer boundary of the underlying OctTree.
   *
   * A boid outside this cannot be re-inserted, so callers integrating position
   * need to be able to see it.
   */
  public get boundary(): THREE.Box3 {
    return this.octTree.boundary;
  }
}
