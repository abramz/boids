import { beforeEach, expect, it } from "vitest";
import Candidates from "../Candidates";

let candidates: Candidates<string>;

beforeEach(() => {
  candidates = new Candidates<string>();
});

function fill(...items: string[]): void {
  items.forEach((item) => candidates.push(item));
}

it("holds what it is given, in the order it was given it", () => {
  fill("a", "b", "c");

  expect(candidates.size).toBe(3);
  expect([...candidates]).toEqual(["a", "b", "c"]);
  expect(candidates.at(1)).toBe("b");
});

it("shows nothing of the previous fill after a reset", () => {
  fill("a", "b", "c");
  candidates.reset();

  expect(candidates.size).toBe(0);
  expect([...candidates]).toEqual([]);

  fill("d", "e", "f", "g", "h");

  expect(candidates.size).toBe(5);
  expect([...candidates]).toEqual(["d", "e", "f", "g", "h"]);
});
