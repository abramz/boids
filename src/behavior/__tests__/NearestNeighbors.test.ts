import { describe, expect, it } from "vitest";
import NearestNeighbors from "../NearestNeighbors";

function held(buffer: NearestNeighbors<string>): [string, number][] {
  return Array.from({ length: buffer.size }, (_, index): [string, number] => [
    buffer.at(index),
    buffer.distanceAt(index),
  ]).sort((a, b) => a[1] - b[1]);
}

describe("NearestNeighbors", () => {
  it("displaces the furthest it holds once it fills up", () => {
    const buffer = new NearestNeighbors<string>();
    buffer.reset(2);

    buffer.offer("near", 1);
    buffer.offer("far", 5);
    buffer.offer("middle", 3);

    expect(held(buffer)).toEqual([
      ["near", 1],
      ["middle", 3],
    ]);
  });

  it("keeps the nearest once it is over the limit, whatever the order", () => {
    const near = new NearestNeighbors<string>();
    const far = new NearestNeighbors<string>();
    near.reset(2);
    far.reset(2);

    ["a:1", "b:2", "c:3", "d:4"].forEach((entry) => {
      const [name, distance] = entry.split(":");
      near.offer(name, Number(distance));
    });
    ["d:4", "c:3", "b:2", "a:1"].forEach((entry) => {
      const [name, distance] = entry.split(":");
      far.offer(name, Number(distance));
    });

    const nearest = [
      ["a", 1],
      ["b", 2],
    ];
    expect(held(near)).toEqual(nearest);
    expect(held(far)).toEqual(nearest);
  });

  it("holds nothing at all for a limit of zero", () => {
    const buffer = new NearestNeighbors<string>();
    buffer.reset(0);

    buffer.offer("a", 1);

    expect(buffer.size).toBe(0);
  });

  it("forgets the previous round when it is reset", () => {
    const buffer = new NearestNeighbors<string>();
    buffer.reset(2);
    buffer.offer("a", 1);
    buffer.offer("b", 2);

    buffer.reset(2);
    buffer.offer("c", 9);

    expect(held(buffer)).toEqual([["c", 9]]);
  });
});
