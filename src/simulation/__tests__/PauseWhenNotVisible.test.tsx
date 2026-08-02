import * as THREE from "three";
import { act, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import PauseWhenNotVisible from "../PauseWhenNotVisible";

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
  clock.stop();

  render(<PauseWhenNotVisible />);
  expect(clock.running).toBe(true);

  act(() => setVisibility("hidden"));
  expect(clock.running).toBe(false);
  expect(clock.getDelta()).toBe(0);

  act(() => setVisibility("visible"));
  expect(clock.running).toBe(true);
});
