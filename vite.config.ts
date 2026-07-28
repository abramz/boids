/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/boids",
  plugins: [
    react({
      babel: {
        plugins: ["module:@react-three/babel"],
      },
    }),
  ],
  optimizeDeps: {
    include: ["three"],
  },
  build: {
    target: "esnext",
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./test-setup.ts"],
    // the simulation tests run hundreds of steps over ~100 boids
    testTimeout: 30_000,
    // Vitest's default include matches *.spec.ts, which would pull in the
    // Playwright specs under e2e/ and run them against jsdom
    exclude: ["**/node_modules/**", "**/dist/**", "e2e/**"],
  },
});
