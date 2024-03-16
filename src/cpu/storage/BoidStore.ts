import * as THREE from "three";
import Boid from "../behavior/Boid";
import OctTree from "./OctTree";

/**
 * Convenience class for dealing with an OctTree in the boid simulation
 */
export default class BoidStore {
  protected boidsRecord: Record<string, Boid>; // cache
  protected octTree: OctTree<Boid>;

  constructor(octTree: OctTree<Boid>) {
    this.boidsRecord = {};
    this.octTree = octTree;
  }

  /**
   * Insert a boid into the cache & the underlying OctTree
   * @param boid the boid to insert
   */
  public insert(boid: Boid): void {
    if (this.boidsRecord[boid.coumpundId]) {
      throw new Error(`boid already inserted, ${boid.coumpundId}`);
    }

    const inserted = this.octTree.insert(boid);
    if (!inserted) {
      throw new Error(`boid unable to be inserted, ${boid.coumpundId}`);
    }

    this.boidsRecord[boid.coumpundId] = boid;
  }

  /**
   * Passthrough to the underlying OctTree's queryRange
   */
  public queryRange(range: THREE.Sphere): Boid[] {
    return this.octTree.queryRange(range);
  }

  /**
   * Claer both the cache & the underlying Octtree
   */
  public clear(): void {
    this.boidsRecord = {};
    this.octTree.clear();
  }

  /**
   * Get all the boids that have been stored
   * This is meant as a convenience to keep references to all the boids
   * as the OctTree is re-generated frequently
   * We don't want a reference that will get `clear`ed
   */
  public get boids(): Boid[] {
    return Object.values(this.boidsRecord);
  }

  /**
   * Get all the boundaries of the underlying OctTree
   */
  public get boundaries(): THREE.Box3[] {
    return this.octTree.boundaries;
  }
}
