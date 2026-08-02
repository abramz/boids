import { ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, create, waitFor } from "@react-three/test-renderer";
import { clear } from "suspend-react";
import SeededWorld from "../../__fixtures__/SeededWorld";

const BOOM = "the simulation step failed";
const FALLBACK = "TestErrorFallback";

const step = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error(BOOM);
  }),
);

vi.mock("../../behavior/step", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../behavior/step")>();

  return { ...actual, default: step };
});

function Fallback(): ReactNode {
  return <group name={FALLBACK} />;
}

beforeEach(() => {
  clear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

it("hands a throw from the simulation step to the error boundary", async () => {
  const renderer = await create(
    <ErrorBoundary FallbackComponent={Fallback}>
      <SeededWorld />
    </ErrorBoundary>,
  );

  await waitFor(() => {
    vi.runAllTimers();
  });

  expect(
    renderer.scene.findAllByType("Group").map((node) => node.instance.name),
    "the fallback rendered before a frame was ever stepped",
  ).not.toContain(FALLBACK);

  await act(async () => {
    await renderer.advanceFrames(4, 1 / 60);
  });

  expect(
    renderer.scene.findAllByType("Group").map((node) => node.instance.name),
  ).toContain(FALLBACK);

  expect(step).toHaveBeenCalledTimes(1);
});
