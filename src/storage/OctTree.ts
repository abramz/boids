import * as THREE from "three";
import { seededRandom } from "../helpers/math";

const tempVector = new THREE.Vector3();

export interface Node {
  position: THREE.Vector3;
}

/**
 * OctTree implementation I made before realizing there is on in the Three.JS add-ons.
 * This one is good enough, so I kept it
 */
export default class OctTree<T extends Node> {
  protected boundary: THREE.Box3;
  protected capacity: number;
  protected seed: number | undefined;
  protected nodes: T[] = [];
  protected children:
    | [
        typeof this,
        typeof this,
        typeof this,
        typeof this,
        typeof this,
        typeof this,
        typeof this,
        typeof this,
      ]
    | undefined;

  constructor(boundary: THREE.Box3, capacity: number, seed?: number) {
    this.boundary = boundary;
    this.capacity = capacity;
    this.seed = seed;
  }

  /**
   * Insert a node into the tree
   * @param node the node to insert
   * @returns true if the node was inserted into the tree or one of it's descendents, otherwise false
   */
  public insert(node: T): boolean {
    if (!this.boundary.containsPoint(node.position)) {
      return false; // node is out of bounds
    }

    if (this.nodes.length < this.capacity) {
      this.nodes.push(node);
      return true; // we have space so don't have to do anything fancy
    }

    if (!this.children) {
      this.subdivide();
    }

    // randomly select a starting index so we spread the load more
    const randomStart = Math.round(seededRandom(1, 8, this.seed));
    for (let i = randomStart; i < randomStart + 8; i++) {
      const child = this.children![i % 8];
      const inserted = child.insert(node);

      if (inserted) {
        return inserted; // short-circuit so it is only inserted in 1 child
      }
    }

    throw new Error(
      "an unknown error occurred and the node could not be inserted",
    );
  }

  /**
   * Subdivide this tree's boundary into 8 equal octants (is that the cubic version of quadrant? idk?)
   */
  protected subdivide(): void {
    const center = new THREE.Vector3();
    this.boundary.getCenter(center);
    const size = new THREE.Vector3();
    this.boundary.getSize(size);
    size.divideScalar(2);

    const ctor = Object.getPrototypeOf(this).constructor;

    // @ts-expect-error we are about to fill this up with the 8 required children
    this.children = [];
    const xPos = [center.x + size.x / 2, center.x - size.x / 2];
    const yPos = [center.y + size.y / 2, center.y - size.y / 2];
    const zPos = [center.z + size.z / 2, center.z - size.z / 2];
    for (let x = 0; x < 2; x++) {
      for (let y = 0; y < 2; y++) {
        for (let z = 0; z < 2; z++) {
          tempVector.set(xPos[x], yPos[y], zPos[z]);
          this.children?.push(
            new ctor(
              new THREE.Box3().setFromCenterAndSize(tempVector, size),
              this.capacity,
              this.seed,
            ),
          );
        }
      }
    }
  }

  /**
   * Find all nodes in any tree that has a boundary intersecting the range
   * @param range range to look for neighbors in
   * @param result the result array, only needed internall
   * @returns all matching nodes
   */
  public queryRange(range: THREE.Sphere): T[] {
    const result: T[] = [];

    this._queryRange(range, result);

    return result;
  }
  protected _queryRange(range: THREE.Sphere, result: T[]): void {
    if (this.boundary.intersectsSphere(range)) {
      for (const node of this.nodes) {
        result.push(node);
      }

      if (this.children) {
        for (const child of this.children) {
          child._queryRange(range, result);
        }
      }
    }
  }

  /**
   * Removes all nodes & children
   */
  public clear(): void {
    this.nodes = [];
    this.children = undefined;
  }

  /**
   * Return the maximum depth of the tree
   */
  public get depth(): number {
    if (!this.children) {
      return 1;
    }

    let maxChildDepth = 0;
    for (const child of this.children) {
      maxChildDepth = Math.max(maxChildDepth, child.depth);
    }

    return 1 + maxChildDepth;
  }

  /**
   * Return the total number of nodes
   */
  public get size(): number {
    if (!this.children) {
      return this.nodes.length;
    }

    let childSize = 0;
    for (const child of this.children) {
      childSize += child.size;
    }

    return this.nodes.length + childSize;
  }

  /**
   * Return the total number of trees
   */
  public get trees(): number {
    if (!this.children) {
      return 1;
    }

    let childSize = 0;
    for (const child of this.children) {
      childSize += child.trees;
    }
    return 1 + childSize;
  }

  /**
   * Return the boundaries of leaves containing nodes
   */
  public get boundaries(): THREE.Box3[] {
    let childBoundaries;
    if (this.children) {
      childBoundaries = this.children.flatMap((child) => child.boundaries);
    }

    if (childBoundaries && childBoundaries.length > 0) {
      return childBoundaries;
    }

    if (this.nodes.length === 0) {
      return [];
    }

    return [this.boundary];
  }
}
