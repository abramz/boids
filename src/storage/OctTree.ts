import * as THREE from "three";

export interface Node {
  position: THREE.Vector3;
}

/**
 * A point octree over a fixed boundary.
 *
 * A cell holds up to `capacity` nodes before it splits into eight, and stops
 * splitting at `maxDepth`, where it simply holds however many it is given.
 * Without that floor a cell full of coincident points would split forever: no
 * subdivision ever separates points that share a position.
 */
export default class OctTree<T extends Node> {
  public readonly boundary: THREE.Box3;
  protected capacity: number;
  protected maxDepth: number;
  protected level: number;
  protected nodes: T[] = [];
  protected children: OctTree<T>[] | undefined;

  /** `level` is how deep this cell already sits, and only subdivide sets it. */
  constructor(
    boundary: THREE.Box3,
    capacity: number,
    maxDepth: number,
    level = 0,
  ) {
    if (capacity < 1) {
      throw new Error(`OctTree capacity must be at least 1, got ${capacity}`);
    }

    this.boundary = boundary;
    this.capacity = capacity;
    this.maxDepth = maxDepth;
    this.level = level;
  }

  /**
   * Insert a node into the tree
   * @param node the node to insert
   * @returns true if the node was inserted into the tree or one of its descendants, otherwise false
   */
  public insert(node: T): boolean {
    if (!this.boundary.containsPoint(node.position)) {
      return false; // node is out of bounds, or its position is not a number
    }

    if (this.nodes.length < this.capacity || this.level >= this.maxDepth) {
      this.nodes.push(node);
      return true;
    }

    if (!this.children) {
      this.subdivide();
    }

    for (const child of this.children!) {
      if (child.insert(node)) {
        return true; // short-circuit so it is only inserted in 1 child
      }
    }

    throw new Error(
      `node at ${node.position.toArray().join()} fell outside every child of ${this.boundary.min.toArray().join()}..${this.boundary.max.toArray().join()}`,
    );
  }

  /**
   * Subdivide this tree's boundary into 8 equal octants.
   *
   * The children are cut straight from the parent's own min, centre and max, so
   * the eight of them tile it exactly. Re-deriving each outer face from a centre
   * and a size instead costs a rounding, and a face that lands a bit inside the
   * parent's leaves a point sitting exactly on that parent face belonging to no
   * child at all, which `insert` can only report as an error.
   */
  protected subdivide(): void {
    const { min, max } = this.boundary;
    /* the same halving Box3.getCenter does, without the vector to hold it */
    const centerX = (min.x + max.x) / 2;
    const centerY = (min.y + max.y) / 2;
    const centerZ = (min.z + max.z) / 2;

    this.children = [];
    for (const [lowX, highX] of [
      [min.x, centerX],
      [centerX, max.x],
    ]) {
      for (const [lowY, highY] of [
        [min.y, centerY],
        [centerY, max.y],
      ]) {
        for (const [lowZ, highZ] of [
          [min.z, centerZ],
          [centerZ, max.z],
        ]) {
          this.children.push(
            new OctTree<T>(
              new THREE.Box3(
                new THREE.Vector3(lowX, lowY, lowZ),
                new THREE.Vector3(highX, highY, highZ),
              ),
              this.capacity,
              this.maxDepth,
              this.level + 1,
            ),
          );
        }
      }
    }
  }

  /**
   * Find every node inside the range.
   *
   * Cells that merely overlap the range are descended into, but only the nodes
   * actually within it come back: a caller filtering the result again would be
   * re-deriving the distance the query already knows.
   *
   * @param range range to look for neighbors in
   * @returns all matching nodes
   */
  public queryRange(range: THREE.Sphere): T[] {
    const result: T[] = [];

    this.collectRange(range, result);

    return result;
  }

  protected collectRange(range: THREE.Sphere, /* OUT */ result: T[]): void {
    if (!this.boundary.intersectsSphere(range)) {
      return;
    }

    for (const node of this.nodes) {
      if (range.containsPoint(node.position)) {
        result.push(node);
      }
    }

    if (this.children) {
      for (const child of this.children) {
        child.collectRange(range, result);
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

  /** How many levels of cell sit at and below this one. */
  public get height(): number {
    if (!this.children) {
      return 1;
    }

    let maxChildHeight = 0;
    for (const child of this.children) {
      maxChildHeight = Math.max(maxChildHeight, child.height);
    }

    return 1 + maxChildHeight;
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

  /** How many cells this one has become, itself included. */
  public get subtreeCount(): number {
    if (!this.children) {
      return 1;
    }

    let childCount = 0;
    for (const child of this.children) {
      childCount += child.subtreeCount;
    }

    return 1 + childCount;
  }

  /**
   * Return the boundary of every tree holding nodes.
   *
   * A subdivided tree keeps the nodes it took before it split, so its own
   * boundary belongs in the result alongside its children's.
   */
  public get boundaries(): THREE.Box3[] {
    const own = this.nodes.length > 0 ? [this.boundary] : [];

    if (!this.children) {
      return own;
    }

    return [...own, ...this.children.flatMap((child) => child.boundaries)];
  }
}
