// vitest/config, not vite: Vitest 4 no longer augments Vite's UserConfig, so a
// `test` key does not typecheck under vite's own defineConfig
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/boids",
  plugins: [react()],
  optimizeDeps: {
    include: ["three"],
  },
  build: {
    target: "esnext",
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./test-setup.ts"],
    // Vitest's default include matches *.spec.ts, which would pull in the
    // Playwright specs under e2e/ and run them against jsdom
    exclude: ["**/node_modules/**", "**/dist/**", "e2e/**"],
  },
});
