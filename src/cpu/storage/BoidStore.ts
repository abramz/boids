import * as THREE from "three";
import Boid from "../behavior/Boid";
import OctTree from "./OctTree";

export default class BoidStore {
  protected boidsRecord: Record<string, Boid>;
  protected octTree: OctTree<Boid>;

  constructor(octTree: OctTree<Boid>) {
    this.boidsRecord = {};
    this.octTree = octTree;
  }

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

  public queryRange(range: THREE.Sphere): Boid[] {
    return this.octTree.queryRange(range);
  }

  public clear(): void {
    this.boidsRecord = {};
    this.octTree.clear();
  }

  public get boids(): Boid[] {
    return Object.values(this.boidsRecord);
  }

  public get boundaries(): THREE.Box3[] {
    return this.octTree.boundaries;
  }

  public get depth(): number {
    return this.octTree.depth;
  }
}
