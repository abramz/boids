export default class NearestNeighbors<T> {
  private readonly items: T[] = [];
  private readonly distances: number[] = [];
  private limit = 0;
  private count = 0;
  private worst = 0;

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
