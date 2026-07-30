import { describe, expect, it } from "vitest";
import { runSimulation } from "./helpers/simulate";

describe("simulation determinism", () => {
  it("gives the same trajectory for the same inputs", () => {
    // if this fails the rest of the behaviour suite is measuring noise
    const first = runSimulation();
    const second = runSimulation();

    expect(second.positions).toEqual(first.positions);
    expect(second.velocities).toEqual(first.velocities);
  });
});
