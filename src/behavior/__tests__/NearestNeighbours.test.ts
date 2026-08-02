import { describe, expect, it } from "vitest";
import NearestNeighbours from "../NearestNeighbours";

/** Held items paired with their distances, ordered nearest first for comparison. */
function held(buffer: NearestNeighbours<string>): [string, number][] {
  return Array.from({ length: buffer.size }, (_, index): [string, number] => [
    buffer.at(index),
    buffer.distanceAt(index),
  ]).sort((a, b) => a[1] - b[1]);
}

describe("NearestNeighbours", () => {
  it("displaces the furthest it holds once it fills up", () => {
    const buffer = new NearestNeighbours<string>();
    buffer.reset(2);

    /* the slot to displace is only found when the buffer fills, so an order
       where the last one in is not the furthest is what tells the two apart */
    buffer.offer("near", 1);
    buffer.offer("far", 5);
    buffer.offer("middle", 3);

    expect(held(buffer)).toEqual([
      ["near", 1],
      ["middle", 3],
    ]);
  });

  it("keeps the nearest once it is over the limit, whatever the order", () => {
    const near = new NearestNeighbours<string>();
    const far = new NearestNeighbours<string>();
    near.reset(2);
    far.reset(2);

    // the same set offered nearest-first and furthest-first, since a buffer
    // that only ever displaces its last entry would pass one and fail the other
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

  it("forgets the previous round when it is reset", () => {
    const buffer = new NearestNeighbours<string>();
    buffer.reset(2);
    buffer.offer("a", 1);
    buffer.offer("b", 2);

    buffer.reset(2);
    buffer.offer("c", 9);

    expect(held(buffer)).toEqual([["c", 9]]);
  });
});
