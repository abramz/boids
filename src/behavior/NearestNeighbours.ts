/**
 * The nearest `limit` of whatever is offered, unordered.
 *
 * Held worst-first so a candidate that cannot make the cut is rejected on one
 * comparison, and the O(limit) rescan only runs when one displaces the current
 * worst, which stops happening almost immediately once the buffer holds the
 * nearest of a large candidate set.
 *
 * Reset and reused rather than allocated: this runs over every candidate the
 * index returns, for every boid that re-aims, every frame.
 */
export default class NearestNeighbours<T> {
  private readonly items: T[] = [];
  private readonly distances: number[] = [];
  private limit = 0;
  private count = 0;
  /** which slot a nearer candidate displaces, valid only once full */
  private worst = 0;

  /** How many are held. */
  public get size(): number {
    return this.count;
  }

  public at(index: number): T {
    return this.items[index];
  }

  public distanceAt(index: number): number {
    return this.distances[index];
  }

  public reset(limit: number): void {
    this.limit = Math.max(0, limit);
    this.count = 0;
    this.worst = 0;
  }

  public offer(item: T, distance: number): void {
    if (this.count < this.limit) {
      this.items[this.count] = item;
      this.distances[this.count] = distance;
      this.count++;

      if (this.count === this.limit) {
        this.findWorst();
      }

      return;
    }

    if (this.limit === 0 || distance >= this.distances[this.worst]) {
      return;
    }

    this.items[this.worst] = item;
    this.distances[this.worst] = distance;
    this.findWorst();
  }

  private findWorst(): void {
    let worst = 0;
    for (let index = 1; index < this.count; index++) {
      if (this.distances[index] > this.distances[worst]) {
        worst = index;
      }
    }

    this.worst = worst;
  }
}
