import * as THREE from "three";
import { act, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import PauseWhenNotVisible from "../PauseWhenNotVisible";

/**
 * A real three Clock, not a fake: `getDelta` returning 0 rather than the whole
 * time the tab spent away is a property of how three implements stopping, and
 * that is the thing standing between a backgrounded tab and the simulation
 * integrating a minute in one frame.
 */
const clock = new THREE.Clock();

vi.mock("@react-three/fiber", () => ({
  useThree: (select: (state: unknown) => unknown) => select({ clock }),
}));

function setVisibility(state: DocumentVisibilityState): void {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

afterEach(() => {
  setVisibility("visible");
  clock.stop();
});

it("stops the clock while the tab is hidden and starts it again on return", () => {
  clock.start();
  render(<PauseWhenNotVisible />);

  act(() => setVisibility("hidden"));
  expect(clock.running).toBe(false);
  expect(clock.getDelta()).toBe(0);

  act(() => setVisibility("visible"));
  expect(clock.running).toBe(true);
});

it("starts a clock that was never running once the tab is visible", () => {
  clock.stop();

  render(<PauseWhenNotVisible />);

  expect(clock.running).toBe(true);
});
