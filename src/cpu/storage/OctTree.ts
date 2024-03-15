import * as THREE from "three";

const tempVector = new THREE.Vector3();

export interface Node {
  position: THREE.Vector3;
}

export default class OctTree<T extends Node> {
  protected boundary: THREE.Box3;
  protected capacity: number;
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

  constructor(boundary: THREE.Box3, capacity: number) {
    this.boundary = boundary;
    this.capacity = capacity;
  }

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

    for (const child of this.children!) {
      const inserted = child.insert(node);

      if (inserted) {
        return inserted; // short-circuit so it is only inserted in 1 child
      }
    }

    return false;
  }

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
              undefined,
              false,
            ),
          );
        }
      }
    }
  }

  public queryRange(range: THREE.Sphere, result: T[] = []): T[] {
    if (this.boundary.intersectsSphere(range)) {
      for (const node of this.nodes) {
        result.push(node);
      }

      if (this.children) {
        for (const child of this.children) {
          child.queryRange(range, result);
        }
      }
    }

    return result;
  }

  public clear(): void {
    this.nodes.length = 0;
    if (this.children) {
      for (const child of this.children) {
        child.clear();
      }
    }
  }

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

  public get boundaries(): THREE.Box3[] {
    if (this.children) {
      return this.children.flatMap((child) => child.boundaries);
    }

    if (this.nodes.length === 0) {
      return [];
    }

    return [this.boundary];
  }
}
