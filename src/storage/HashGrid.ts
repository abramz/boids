import * as THREE from "three";
import Candidates from "./Candidates";
import type { Node } from "./Node";

export interface HashGridOptions {
  /** the side of one cell, in world units */
  cellSize: number;
  /** how many buckets the table holds, rounded up to a power of two */
  tableSize: number;
}

/* Teschner et al. 2003, by way of Muller's Ten Minute Physics 11. imul rather
   than `*` so each product stays in int32 instead of going through a double
   and losing its low bits on the way back. */
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

/**
 * A uniform grid over unbounded space, as a hash table of its occupied cells.
 *
 * There is no outer boundary: cell coordinates run as far as a position does,
 * and a fixed table of buckets stands in for the infinite array of cells they
 * index. Two cells can therefore share a bucket, so every entry carries the
 * cell it actually belongs to and a query skips the ones that only collided
 * with it. That makes a collision cost a comparison rather than a wrong answer,
 * and it is what lets the table be smaller than the space it covers.
 *
 * Built by counting sort, in three linear passes over two typed arrays and
 * without allocating: count per bucket, prefix sum into offsets, scatter. The
 * flock is rebuilt into it every frame it moves, so the build is as much of the
 * cost as the query.
 */
export default class HashGrid<T extends Node> {
  private readonly cellSize: number;
  /** the table is a power of two, so a hash is masked rather than divided */
  private readonly mask: number;
  /** bucket b holds sorted[cellStart[b]..cellStart[b + 1]) */
  private readonly cellStart: Int32Array;
  private nodes: readonly T[] = [];
  private sorted = new Int32Array(0);
  /** the cell each node sits in, three coordinates per node */
  private cells = new Int32Array(0);

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
    /* one past the last bucket, holding the end of it */
    this.cellStart = new Int32Array(buckets + 1);
  }

  /**
   * Index `nodes` where they are now, replacing whatever was indexed before.
   *
   * The array is held by reference rather than copied, so a caller that keeps
   * one array of nodes and moves them within it rebuilds by calling this again.
   */
  public build(nodes: readonly T[]): void {
    this.nodes = nodes;

    if (this.sorted.length !== nodes.length) {
      this.sorted = new Int32Array(nodes.length);
      this.cells = new Int32Array(nodes.length * 3);
    }

    this.cellStart.fill(0);
    for (let index = 0; index < nodes.length; index++) {
      const { x, y, z } = nodes[index].position;
      const base = index * 3;
      this.cells[base] = this.cellOf(x);
      this.cells[base + 1] = this.cellOf(y);
      this.cells[base + 2] = this.cellOf(z);

      this.cellStart[this.bucketAt(base)]++;
    }

    /* running total, leaving each bucket holding where it ends */
    let total = 0;
    for (let bucket = 0; bucket <= this.mask; bucket++) {
      total += this.cellStart[bucket];
      this.cellStart[bucket] = total;
    }
    /* the last bucket ends at the end, and nothing below walks this one back */
    this.cellStart[this.mask + 1] = total;

    /* placing each node walks its bucket's end back down to its start, which is
       what leaves cellStart holding starts once every node has been placed */
    for (let index = 0; index < nodes.length; index++) {
      const bucket = this.bucketAt(index * 3);
      this.cellStart[bucket]--;
      this.sorted[this.cellStart[bucket]] = index;
    }
  }

  /**
   * Collect every node inside the range into `out`, which is reset first.
   *
   * Only the nodes actually within the range come back, so a caller filtering
   * the result again would be re-deriving what the query already knows.
   */
  public queryRange(range: THREE.Sphere, /* OUT */ out: Candidates<T>): void {
    out.reset();

    const { center, radius } = range;
    /* however many cells deep the radius reaches, so a range wider than a cell
       still finds everything rather than quietly missing the outside of it */
    const shell = Math.ceil(radius / this.cellSize);
    const span = 2 * shell + 1;

    if (span * span * span >= this.nodes.length) {
      /* more cells to walk than there are nodes to test, which is where a wide
         enough perception radius takes this */
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

  /** The cell of every node in the index, deduplicated. For the debug overlay. */
  public get occupiedCells(): THREE.Box3[] {
    const seen = new Set<string>();
    const boxes: THREE.Box3[] = [];

    for (let index = 0; index < this.nodes.length; index++) {
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

  /** How many nodes are indexed. */
  public get size(): number {
    return this.nodes.length;
  }

  private collectCell(
    x: number,
    y: number,
    z: number,
    range: THREE.Sphere,
    /* OUT */ out: Candidates<T>,
  ): void {
    const bucket = this.bucket(x, y, z);
    const end = this.cellStart[bucket + 1];

    for (let slot = this.cellStart[bucket]; slot < end; slot++) {
      const index = this.sorted[slot];
      const base = index * 3;

      /* the bucket holds every cell that hashed to it, so this is where a
         collision is separated back out from a real neighbour */
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

  private collectAll(range: THREE.Sphere, /* OUT */ out: Candidates<T>): void {
    for (const node of this.nodes) {
      if (range.containsPoint(node.position)) {
        out.push(node);
      }
    }
  }

  /**
   * Which cell an axis coordinate falls in.
   *
   * Floored rather than truncated, so that the cells either side of zero are
   * distinct rather than sharing the one straddling it, and taken to int32 at
   * both ends so that a coordinate far enough out to wrap wraps the same way
   * when it is stored as when it is looked up.
   */
  private cellOf(coordinate: number): number {
    return Math.floor(coordinate / this.cellSize) | 0;
  }

  private bucket(x: number, y: number, z: number): number {
    return (
      (Math.imul(x, HASH_X) ^ Math.imul(y, HASH_Y) ^ Math.imul(z, HASH_Z)) &
      this.mask
    );
  }

  private bucketAt(base: number): number {
    return this.bucket(
      this.cells[base],
      this.cells[base + 1],
      this.cells[base + 2],
    );
  }
}
