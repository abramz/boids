import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

/**
 * The app is served under `base: "/boids"`, so the preview root 302s and the
 * real entry point is /boids/.
 */
export const BASE_URL = "http://localhost:4173";
export const APP_PATH = "/boids/";

/**
 * Some environments ship a preinstalled Chromium that doesn't match the
 * revision this Playwright version would download. Prefer the local browser
 * when Playwright can find its own, otherwise fall back to whatever is
 * installed under PLAYWRIGHT_BROWSERS_PATH.
 */
function preinstalledChromium(): string | undefined {
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!root) {
    return undefined;
  }

  const candidates = [
    `${root}/chromium-1194/chrome-linux/chrome`,
    `${root}/chromium/chrome-linux/chrome`,
  ];

  return candidates.find((candidate) => existsSync(candidate));
}

const executablePath = preinstalledChromium();

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["html"], ["list"]] : "list",

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          ...(executablePath ? { executablePath } : {}),
          // headless WebGL is the single biggest source of flake here; force
          // SwiftShader so the GL context is software-rendered and consistent
          args: [
            "--use-gl=angle",
            "--use-angle=swiftshader",
            "--enable-unsafe-swiftshader",
            "--disable-gpu-sandbox",
          ],
        },
      },
    },
  ],

  webServer: {
    command: "npm run build && npm run preview",
    url: `${BASE_URL}${APP_PATH}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
