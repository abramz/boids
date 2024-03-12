import { resolve } from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/boids",
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        cpu: resolve(__dirname, "cpu.html"),
        gpu: resolve(__dirname, "gpu.html"),
      },
    },
  },
});
