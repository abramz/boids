/// <reference types="vitest" />
import { resolve } from "path";
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
  build: {
    rollupOptions: {
      input: {
        cpu: resolve(__dirname, "cpu.html"),
        gpu: resolve(__dirname, "gpu.html"),
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./test-setup.ts"],
    deps: {
      optimizer: {
        web: {
          enabled: true,
          include: ["./node_modules/three"],
        },
      },
    },
  },
});
