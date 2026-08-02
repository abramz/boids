import { expect, test } from "@playwright/test";
import { APP_PATH } from "../playwright.config";

/**
 * The only test that sees the real app.
 *
 * Everything else in this repo runs under jsdom with a mocked canvas, so a
 * blank page, a dead WebGL context, or a broken asset path would ship green.
 * These assertions exist to make that impossible.
 */

/**
 * Console output that is not ours to fix: r3f builds the clock the simulation
 * runs off, and three deprecated the class under it. Anything not on this list
 * fails the run, so a warning three starts emitting about our own use of it has
 * somewhere to show up.
 */
const EXPECTED_CONSOLE = ["THREE.Clock: This module has been deprecated"];

const FAILING_CONSOLE_TYPES = ["error", "warning"];

/**
 * Floor for "the canvas drew something", measured against this build under
 * SwiftShader: a live scene screenshots to ~400 kB and a smaller window to
 * ~280 kB, against ~19 kB for a canvas whose context has been lost and ~18 kB
 * for the page with the canvas hidden outright - element screenshots include
 * the leva panel over it. Coarse on purpose, so it survives driver differences
 * that any pixel comparison would not, but it has to clear that floor to mean
 * anything.
 */
const LIVE_SCENE_BYTES = 100_000;

/**
 * A leva folder that only exists once World has mounted, which is to say once
 * Suspense has resolved and the flock has been built. Nothing else the
 * app renders past that point is DOM - it is all canvas - so this is the signal
 * that the simulation is up and it is fair to start asserting on it. It is also
 * the only check that leva rendered at all, by its text rather than by the
 * hashed class names emotion generates for it.
 */
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

    // wait for the simulation before judging it: the canvas is visible from the
    // first paint, so everything below would otherwise be asserted against a
    // page that has not finished mounting, and pass by being early
    await expect(page.getByText(SIMULATION_READY)).toBeVisible();

    // catches base-path breakage, which is otherwise invisible - the page still
    // renders, it just renders nothing
    expect(failedRequests).toEqual([]);

    // no error boundary, no crash during mount or the frames after it
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);

    // the loading fallback is gone and no error alert replaced it
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

    // getContext creates a context when the canvas has none, so its mere
    // existence proves nothing. An untouched <canvas> does keep its intrinsic
    // 300x150 though, and three sizes this one to the page - so a surface
    // bigger than that is what says the renderer took the element over, and
    // proves the resize listener + configure path in Canvas.tsx ran.
    expect(surface.clientWidth).toBeGreaterThan(300);
    expect(surface.clientHeight).toBeGreaterThan(150);
    expect(surface.bufferWidth).toBeGreaterThan(300);
    expect(surface.contextLost).toBe(false);

    // the canvas has real content rather than a blank frame
    const rendered = await canvas.screenshot();
    expect(rendered.byteLength).toBeGreaterThan(LIVE_SCENE_BYTES);

    // and it survives a resize. Canvas.tsx re-runs configure on every one of
    // them, which is r3f re-applying its whole renderer config rather than only
    // the size, so this is the path where a dropped setting would show up.
    await page.setViewportSize({ width: 900, height: 600 });
    await expect
      .poll(() => canvas.evaluate((element) => element.clientWidth))
      .toBe(900);

    const resized = await canvas.screenshot();
    expect(resized.byteLength).toBeGreaterThan(LIVE_SCENE_BYTES);
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);

    // Nothing here checks that the app is animating: an injected rAF loop ticks
    // at 60Hz even if React and r3f are dead. golden.render.test.tsx covers
    // that, where instance matrices can be read directly.
  });
});

/**
 * No pixel comparison here. Under headless SwiftShader `canvas.screenshot()`
 * returns a stale compositor surface - byte-identical across seconds, and
 * unchanged even after dragging the camera - and `gl.readPixels` returns zeros
 * because three runs with `preserveDrawingBuffer: false`. Any motion assertion
 * built on pixels measures the capture pipeline, not the app.
 */
