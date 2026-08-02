import { expect, it, vi } from "vitest";
import { create } from "@react-three/test-renderer";
import { AlertContext } from "../../hooks/alertContext";
import ErrorFallback from "../ErrorFallback";

/**
 * What the boundary inside the r3f tree renders. Nothing it returns is drawn
 * where it sits - the panel is DOM, and the tree it is in is canvas - so what
 * has to hold is that the message is handed up to the shell that can show it.
 */
async function fallbackFor(thrown: unknown) {
  const setAlertContents = vi.fn();

  await create(
    <AlertContext.Provider value={{ setAlertContents }}>
      <ErrorFallback error={thrown} resetErrorBoundary={vi.fn()} />
    </AlertContext.Provider>,
  );

  return setAlertContents;
}

it("should hand the message up to the shell that can draw it", async () => {
  const setAlertContents = await fallbackFor(new Error("the flock exploded"));

  expect(setAlertContents).toHaveBeenCalledOnce();
  const [panel] = setAlertContents.mock.calls[0];
  expect(panel.props.error).toEqual(new Error("the flock exploded"));
});

it("should carry something thrown that was never an Error", async () => {
  // react-error-boundary types what it catches as unknown, because anything can
  // be thrown, and a panel that renders "[object Object]" says nothing
  const setAlertContents = await fallbackFor("a bare string");

  const [panel] = setAlertContents.mock.calls[0];
  expect(panel.props.error).toBe("a bare string");
});
