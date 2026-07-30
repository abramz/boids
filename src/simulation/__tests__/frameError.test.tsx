import { ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, create, waitFor } from "@react-three/test-renderer";
import { clear } from "suspend-react";
import SeededWorld from "../../__fixtures__/SeededWorld";

/**
 * r3f calls useFrame subscribers straight out of requestAnimationFrame, so a
 * throw in the simulation step has no React on the stack to catch it and the
 * next frame is already queued. Left alone that is a frozen picture and an error
 * a second, forever. The boid store throws for real when a position goes
 * non-finite and the index cannot hold it, so this is the path that failure
 * actually takes.
 */

const BOOM = "boid outside the storage boundary, 0-0";
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
  /* the built flock is cached under its world's shape, so without this a
     second render in this file is handed the first one's advanced simulation */
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

  // and the loop gave up rather than throwing once per frame until React got
  // around to tearing the subtree down
  expect(step).toHaveBeenCalledTimes(1);
});
