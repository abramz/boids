import { expect, test } from "@playwright/test";
import { APP_PATH } from "../playwright.config";

const EXPECTED_CONSOLE = ["THREE.Clock: This module has been deprecated"];

const FAILING_CONSOLE_TYPES = ["error", "warning"];

const LIVE_SCENE_BYTES = 100_000;

const SIMULATION_READY = "Boid Properties";

test.describe("boids renders and runs", () => {
  test("loads, acquires a live WebGL surface, and draws to it", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const failedRequests: string[] = [];

    page.on("console", (message) => {
      if (
        FAILING_CONSOLE_TYPES.includes(message.type()) &&
        !EXPECTED_CONSOLE.some((allowed) => message.text().includes(allowed))
      ) {
        consoleErrors.push(`${message.type()}: ${message.text()}`);
      }
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("response", (response) => {
      if (response.status() >= 400) {
        failedRequests.push(`${response.status()} ${response.url()}`);
      }
    });

    await page.goto(APP_PATH);

    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible();

    await expect(page.getByText(SIMULATION_READY)).toBeVisible();

    expect(failedRequests).toEqual([]);

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);

    await expect(page.locator(".alert")).toHaveCount(0);

    const surface = await canvas.evaluate((element) => {
      const canvasElement = element as HTMLCanvasElement;
      const context = canvasElement.getContext("webgl2");

      return {
        clientWidth: canvasElement.clientWidth,
        clientHeight: canvasElement.clientHeight,
        bufferWidth: context?.drawingBufferWidth ?? 0,
        contextLost: context?.isContextLost() ?? true,
      };
    });

    expect(surface.clientWidth).toBeGreaterThan(300);
    expect(surface.clientHeight).toBeGreaterThan(150);
    expect(surface.bufferWidth).toBeGreaterThan(300);
    expect(surface.contextLost).toBe(false);

    const rendered = await canvas.screenshot();
    expect(rendered.byteLength).toBeGreaterThan(LIVE_SCENE_BYTES);

    await page.setViewportSize({ width: 900, height: 600 });
    await expect
      .poll(() => canvas.evaluate((element) => element.clientWidth))
      .toBe(900);

    const resized = await canvas.screenshot();
    expect(resized.byteLength).toBeGreaterThan(LIVE_SCENE_BYTES);
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
});
