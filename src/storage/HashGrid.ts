import * as THREE from "three";
import QueryResults from "./QueryResults";
import type { Node } from "./Node";

export interface HashGridOptions {
  cellSize: number;
  tableSize: number;
}

const HASH_X = 92837111;
const HASH_Y = 689287499;
const HASH_Z = 283923481;

function nextPowerOfTwo(value: number): number {
  let size = 1;
  while (size < value) {
    size *= 2;
  }

  return size;
}

export default class HashGrid<T extends Node> {
  private readonly cellSize: number;
  private readonly mask: number;
  private readonly cellStart: Int32Array;
  private nodes: readonly T[] = [];
  private count = 0;
  private sorted = new Int32Array(0);
  private cells = new Float64Array(0);

  constructor({ cellSize, tableSize }: HashGridOptions) {
    if (cellSize <= 0) {
      throw new Error(`HashGrid cellSize must be positive, got ${cellSize}`);
    }
    if (tableSize < 1) {
      throw new Error(
        `HashGrid tableSize must be at least 1, got ${tableSize}`,
      );
    }

    const buckets = nextPowerOfTwo(tableSize);
    this.cellSize = cellSize;
    this.mask = buckets - 1;
    this.cellStart = new Int32Array(buckets + 1);
  }

  public build(nodes: readonly T[]): void {
    this.nodes = nodes;
    this.count = nodes.length;

    if (this.sorted.length !== nodes.length) {
      this.sorted = new Int32Array(nodes.length);
      this.cells = new Float64Array(nodes.length * 3);
    }

    this.cellStart.fill(0);
    for (let index = 0; index < nodes.length; index++) {
      const { x, y, z } = nodes[index].position;
      const base = index * 3;
      this.cells[base] = this.cellOf(x);
      this.cells[base + 1] = this.cellOf(y);
      this.cells[base + 2] = this.cellOf(z);

      this.cellStart[this.bucketOf(index)]++;
    }

    let total = 0;
    for (let bucket = 0; bucket <= this.mask; bucket++) {
      total += this.cellStart[bucket];
      this.cellStart[bucket] = total;
    }
    this.cellStart[this.mask + 1] = total;

    for (let index = 0; index < nodes.length; index++) {
      const bucket = this.bucketOf(index);
      this.cellStart[bucket]--;
      this.sorted[this.cellStart[bucket]] = index;
    }
  }

  public queryRange(range: THREE.Sphere, out: QueryResults<T>): void {
    out.reset();

    const { center, radius } = range;
    const shell = Math.ceil(radius / this.cellSize);
    const span = 2 * shell + 1;

    if (span * span * span >= this.count) {
      this.collectAll(range, out);

      return;
    }

    const centerX = this.cellOf(center.x);
    const centerY = this.cellOf(center.y);
    const centerZ = this.cellOf(center.z);

    for (let x = centerX - shell; x <= centerX + shell; x++) {
      for (let y = centerY - shell; y <= centerY + shell; y++) {
        for (let z = centerZ - shell; z <= centerZ + shell; z++) {
          this.collectCell(x, y, z, range, out);
        }
      }
    }
  }

  public occupiedCells(): THREE.Box3[] {
    const seen = new Set<string>();
    const boxes: THREE.Box3[] = [];

    for (let index = 0; index < this.count; index++) {
      const base = index * 3;
      const x = this.cells[base];
      const y = this.cells[base + 1];
      const z = this.cells[base + 2];

      const key = `${x},${y},${z}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);

      boxes.push(
        new THREE.Box3(
          new THREE.Vector3(
            x * this.cellSize,
            y * this.cellSize,
            z * this.cellSize,
          ),
          new THREE.Vector3(
            (x + 1) * this.cellSize,
            (y + 1) * this.cellSize,
            (z + 1) * this.cellSize,
          ),
        ),
      );
    }

    return boxes;
  }

  private collectCell(
    x: number,
    y: number,
    z: number,
    range: THREE.Sphere,
    out: QueryResults<T>,
  ): void {
    const bucket = this.bucket(x, y, z);
    const end = this.cellStart[bucket + 1];

    for (let slot = this.cellStart[bucket]; slot < end; slot++) {
      const index = this.sorted[slot];
      const base = index * 3;

      if (
        this.cells[base] !== x ||
        this.cells[base + 1] !== y ||
        this.cells[base + 2] !== z
      ) {
        continue;
      }

      const node = this.nodes[index];
      if (range.containsPoint(node.position)) {
        out.push(node);
      }
    }
  }

  private collectAll(range: THREE.Sphere, out: QueryResults<T>): void {
    for (let index = 0; index < this.count; index++) {
      const node = this.nodes[index];
      if (range.containsPoint(node.position)) {
        out.push(node);
      }
    }
  }

  private cellOf(coordinate: number): number {
    return Math.floor(coordinate / this.cellSize);
  }

  private bucket(x: number, y: number, z: number): number {
    return (
      (Math.imul(x, HASH_X) ^ Math.imul(y, HASH_Y) ^ Math.imul(z, HASH_Z)) &
      this.mask
    );
  }

  private bucketOf(index: number): number {
    const base = index * 3;

    return this.bucket(
      this.cells[base],
      this.cells[base + 1],
      this.cells[base + 2],
    );
  }
}
