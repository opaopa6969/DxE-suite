import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

export default defineConfig({
  plugins: [preact()],
  base: "./",
  build: {
    outDir: "../dist",
    emptyDir: false,
  },
  preview: {
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
