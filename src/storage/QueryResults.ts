export default class QueryResults<T> {
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

  public *[Symbol.iterator](): IterableIterator<T> {
    for (let index = 0; index < this.count; index++) {
      yield this.items[index];
    }
  }
}
