import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import Canvas from "../Canvas";

const root = vi.hoisted(() => ({
  configure: vi.fn<(config?: unknown) => Promise<unknown>>(),
  render: vi.fn(),
  unmount: vi.fn(),
}));

vi.mock("@react-three/fiber", () => ({
  events: {},
  createRoot: () => root,
}));

/* the control panel is a lazy chunk of its own and none of this is about it */
vi.mock("../UI", () => ({ default: () => null }));

beforeEach(() => {
  vi.clearAllMocks();
  root.configure.mockResolvedValue(root);
});

/* vitest runs without globals, so testing-library's own auto-cleanup is never
   registered and one test's DOM is still standing in the next */
afterEach(cleanup);

it("should say what went wrong when the renderer cannot be created", async () => {
  /* configure is where the WebGLRenderer is built, and r3f leaves the tree
     unmounted when it throws: the error boundary inside that tree never runs,
     so a browser with WebGL blocked gets a blank page and a console line */
  root.configure.mockRejectedValue(
    new Error("THREE.WebGLRenderer: Error creating WebGL context"),
  );

  render(<Canvas />);

  const alert = await screen.findByRole("alert");
  expect(alert.textContent).toContain("Error creating WebGL context");
});

it("should show nothing at all when the renderer comes up", async () => {
  render(<Canvas />);

  await waitFor(() => expect(root.render).toHaveBeenCalled());

  expect(screen.queryByRole("alert")).toBeNull();
});
