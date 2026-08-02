import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

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
    exclude: [...configDefaults.exclude, "e2e/**", ".scratch/**"],
    coverage: {
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/__tests__/**",
        "src/**/__benchmarks__/**",
        "src/__fixtures__/**",
        "src/main.tsx",
        "src/threeElements.ts",
        "src/vite-env.d.ts",
      ],
      thresholds: {
        statements: 96,
        branches: 92,
        lines: 96,
        functions: 90,
      },
    },
  },
});
