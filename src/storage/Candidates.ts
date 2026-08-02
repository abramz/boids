/**
 * What a spatial index hands back, reset and refilled rather than allocated: a
 * query runs for every boid that re-aims, every frame, and a fresh array out of
 * each one is thousands of throwaway arrays a second on the one path that
 * cannot afford them.
 */
export default class Candidates<T> {
  private readonly items: T[] = [];
  private count = 0;

  public get size(): number {
    return this.count;
  }

  public at(index: number): T {
    return this.items[index];
  }

  public reset(): void {
    this.count = 0;
  }

  public push(item: T): void {
    this.items[this.count] = item;
    this.count++;
  }

  /** For assertions; the hot path reads `size` and `at` instead. */
  public *[Symbol.iterator](): IterableIterator<T> {
    for (let index = 0; index < this.count; index++) {
      yield this.items[index];
    }
  }
}
