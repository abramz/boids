// vitest/config, not vite: Vitest 4 no longer augments Vite's UserConfig, so a
// `test` key does not typecheck under vite's own defineConfig
import { configDefaults, defineConfig } from "vitest/config";
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
    // Playwright specs under e2e/ and run them against jsdom. The defaults are
    // spread back in rather than replaced: written out by hand they lose the
    // scratch and cache directories, and a throwaway probe left in one then
    // joins every local run and every pre-commit hook.
    exclude: [...configDefaults.exclude, "e2e/**", ".scratch/**"],
    coverage: {
      /* everything under src, not just what a test happened to import: a file
         nothing reaches is missing from the report rather than reported at
         zero, which reads as covered */
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/__tests__/**",
        "src/__fixtures__/**",
        "src/main.tsx",
        "src/threeElements.ts",
        "src/vite-env.d.ts",
      ],
      /* set just under where the suite stands, so this gates rather than
         reports: the scene composition and the DOM shell are covered by the
         browser smoke test instead, which is what leaves headroom here */
      thresholds: {
        statements: 85,
        branches: 85,
        lines: 85,
        functions: 75,
      },
    },
  },
});
