import { beforeEach, expect, it } from "vitest";
import QueryResults from "../QueryResults";

let found: QueryResults<string>;

beforeEach(() => {
  found = new QueryResults<string>();
});

function fill(...items: string[]): void {
  items.forEach((item) => found.push(item));
}

it("holds what it is given, in the order it was given it", () => {
  fill("a", "b", "c");

  expect(found.size).toBe(3);
  expect([...found]).toEqual(["a", "b", "c"]);
  expect(found.at(1)).toBe("b");
});

it("shows nothing of the previous fill after a reset", () => {
  fill("a", "b", "c");
  found.reset();

  expect(found.size).toBe(0);
  expect([...found]).toEqual([]);

  fill("d", "e", "f", "g", "h");

  expect(found.size).toBe(5);
  expect([...found]).toEqual(["d", "e", "f", "g", "h"]);
});
