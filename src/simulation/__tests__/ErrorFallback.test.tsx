import { expect, it, vi } from "vitest";
import { create } from "@react-three/test-renderer";
import { AlertContext } from "../../hooks/alertContext";
import ErrorFallback from "../ErrorFallback";

async function fallbackFor(thrown: unknown) {
  const setAlertContents = vi.fn();

  await create(
    <AlertContext.Provider value={{ setAlertContents }}>
      <ErrorFallback error={thrown} resetErrorBoundary={vi.fn()} />
    </AlertContext.Provider>,
  );

  return setAlertContents;
}

it("hands the message up to the shell that can draw it", async () => {
  const setAlertContents = await fallbackFor(new Error("the flock exploded"));

  expect(setAlertContents).toHaveBeenCalledOnce();
  const [panel] = setAlertContents.mock.calls[0];
  expect(panel.props.error).toEqual(new Error("the flock exploded"));
});

it("carries something thrown that was never an Error", async () => {
  const setAlertContents = await fallbackFor("a bare string");

  const [panel] = setAlertContents.mock.calls[0];
  expect(panel.props.error).toBe("a bare string");
});
