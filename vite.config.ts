import { defineConfig } from "vite";
import { resolve } from "node:path";
export default defineConfig({
  root: "demo",
  resolve: { alias: { "@": resolve(process.cwd()) } },
  base: "./",
  esbuild: { jsx: "automatic" },
  build: { outDir: "../demo-dist", emptyOutDir: true },
  server: { host: "0.0.0.0" },
  preview: { host: "0.0.0.0" },
});
