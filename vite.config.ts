import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.config";
import * as path from "node:path";

export default defineConfig({
  plugins: [svelte(), tailwindcss(), crx({ manifest })],
  resolve: {
    alias: {
      $lib: path.resolve("./src/lib"),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: { port: 5173 },
    cors: { origin: [/chrome-extension:\/\//] },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  esbuild: {
    // Strip console.log and console.debug in production builds
    drop: process.env.NODE_ENV === "production" ? ["console", "debugger"] : [],
  },
});
