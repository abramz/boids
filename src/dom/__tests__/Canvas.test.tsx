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

vi.mock("../UI", () => ({ default: () => null }));

beforeEach(() => {
  vi.clearAllMocks();
  root.configure.mockResolvedValue(root);
});

afterEach(cleanup);

it("says what went wrong when the renderer cannot be created", async () => {
  root.configure.mockRejectedValue(
    new Error("THREE.WebGLRenderer: Error creating WebGL context"),
  );

  render(<Canvas />);

  const alert = await screen.findByRole("alert");
  expect(alert.textContent).toContain("Error creating WebGL context");
});

it("shows nothing at all when the renderer comes up", async () => {
  render(<Canvas />);

  await waitFor(() => expect(root.render).toHaveBeenCalled());

  expect(screen.queryByRole("alert")).toBeNull();
});
