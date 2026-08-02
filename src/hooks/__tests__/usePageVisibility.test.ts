import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import usePageVisibility from "../usePageVisibility";

/**
 * Replaces react-page-visibility, so the behaviour it provided needs pinning:
 * the simulation clock is started and stopped off this value.
 */

function setVisibility(state: DocumentVisibilityState): void {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

afterEach(() => {
  vi.restoreAllMocks();
  setVisibility("visible");
});

describe("usePageVisibility", () => {
  it("goes false when the document is hidden and back when it returns", () => {
    const { result } = renderHook(() => usePageVisibility());

    expect(result.current).toBe(true);

    act(() => setVisibility("hidden"));
    expect(result.current).toBe(false);

    act(() => setVisibility("visible"));
    expect(result.current).toBe(true);
  });

  // `result.current` freezes at the last render either way, so it can say
  // nothing about whether the listener actually went away. document is the
  // external dependency here, so its own book-keeping is what to read.
  it("gives its visibilitychange listener back on unmount", () => {
    const subscribe = vi.spyOn(document, "addEventListener");
    const unsubscribe = vi.spyOn(document, "removeEventListener");

    const { unmount } = renderHook(() => usePageVisibility());

    const subscribed = subscribe.mock.calls.find(
      ([type]) => type === "visibilitychange",
    );
    expect(subscribed, "never subscribed").toBeDefined();

    unmount();

    expect(unsubscribe).toHaveBeenCalledWith(
      "visibilitychange",
      subscribed![1],
    );
  });
});
