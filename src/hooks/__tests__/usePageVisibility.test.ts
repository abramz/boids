import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import usePageVisibility from "../usePageVisibility";

/**
 * Replaces react-page-visibility, so the behaviour it provided needs pinning:
 * the simulation clock is started and stopped off this value, and a wrong
 * initial reading would freeze the whole app on load.
 */

function setVisibility(state: DocumentVisibilityState): void {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

afterEach(() => {
  setVisibility("visible");
});

describe("usePageVisibility", () => {
  it("reports visible on mount", () => {
    const { result } = renderHook(() => usePageVisibility());

    expect(result.current).toBe(true);
  });

  it("goes false when the document is hidden and back when it returns", () => {
    const { result } = renderHook(() => usePageVisibility());

    act(() => setVisibility("hidden"));
    expect(result.current).toBe(false);

    act(() => setVisibility("visible"));
    expect(result.current).toBe(true);
  });

  it("stops listening once unmounted", () => {
    const { result, unmount } = renderHook(() => usePageVisibility());

    unmount();
    // must not throw or update a torn-down hook
    act(() => setVisibility("hidden"));
    expect(result.current).toBe(true);
  });
});
