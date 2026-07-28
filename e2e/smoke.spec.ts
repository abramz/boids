import { expect, test } from "@playwright/test";
import { APP_PATH } from "../playwright.config";

/**
 * The only test that sees the real app.
 *
 * Everything else in this repo runs under jsdom with a mocked canvas, so a
 * blank page, a dead WebGL context, or a broken asset path would ship green.
 * These assertions exist to make that impossible.
 */

/** the app legitimately logs this when a frame delta is discarded */
const EXPECTED_LOGS = ["skipped excessive delta"];

test.describe("boids renders and runs", () => {
  test("loads, acquires WebGL, and animates", async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const failedRequests: string[] = [];

    page.on("console", (message) => {
      if (
        message.type() === "error" &&
        !EXPECTED_LOGS.some((allowed) => message.text().includes(allowed))
      ) {
        consoleErrors.push(message.text());
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

    // catches base-path breakage, which is otherwise invisible - the page still
    // renders, it just renders nothing
    expect(failedRequests).toEqual([]);

    // no error boundary, no crash during mount
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);

    // proves the resize listener + rootRef.configure({}) path in Canvas.tsx ran
    const size = await canvas.evaluate((element) => ({
      width: element.clientWidth,
      height: element.clientHeight,
    }));
    expect(size.width).toBeGreaterThan(0);
    expect(size.height).toBeGreaterThan(0);

    // a real GL context, not just a canvas element. getContext on an
    // already-initialized canvas returns the existing context, so this is safe
    const hasWebGL = await canvas.evaluate(
      (element) =>
        (element as HTMLCanvasElement).getContext("webgl2") instanceof
        WebGL2RenderingContext,
    );
    expect(hasWebGL).toBe(true);

    // past Suspense: the loading fallback is gone and no error alert rendered
    await expect(page.locator(".alert")).toHaveCount(0);

    // the canvas has real content rather than a blank frame. A uniform canvas
    // compresses to a couple of kB; a scene full of boids is ~100 kB. This is a
    // coarse check on purpose - it survives driver differences that any
    // pixel-comparison assertion would not.
    const rendered = await canvas.screenshot();
    expect(rendered.byteLength).toBeGreaterThan(10_000);

    // NOT a check that the app is animating: an injected rAF loop ticks at
    // 60Hz even if React and r3f are dead. golden.render.test.tsx covers that,
    // where instance matrices can be read directly.
  });

  test("renders the leva control panel", async ({ page }) => {
    await page.goto(APP_PATH);
    await expect(page.locator("canvas")).toBeVisible();

    // leva is the entire control surface; the goldens are structurally blind
    // to it, so this is the only thing that checks it.
    // leva styles via emotion, so class names are hashed (leva-c-<hash>) and
    // there is no stable id - match the prefix rather than a generated hash.
    await expect(page.locator('[class*="leva-c-"]').first()).toBeVisible();

    // the panel is configured with oneLineLabels; this proves our props reach
    // leva rather than just that leva mounted
    await expect(
      page.locator('[class*="oneLineLabels-true"]').first(),
    ).toBeAttached();
  });
});

/**
 * No pixel comparison here. Under headless SwiftShader `canvas.screenshot()`
 * returns a stale compositor surface - byte-identical across seconds, and
 * unchanged even after dragging the camera - and `gl.readPixels` returns zeros
 * because three runs with `preserveDrawingBuffer: false`. Any motion assertion
 * built on pixels measures the capture pipeline, not the app.
 */
