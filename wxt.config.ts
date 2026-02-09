import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";
import * as path from "node:path";

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: "src",
  outDir: "dist",
  modules: ["@wxt-dev/module-svelte"],
  manifestVersion: 3,

  manifest: ({ browser }) => ({
    name: "Auto Price Converter",
    description:
      "Automatically converts prices on websites to your chosen currency using live exchange rates",
    // version is auto-managed by WXT from package.json
    icons: {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png",
    },
    action: {
      default_icon: {
        "16": "icons/icon16.png",
        "32": "icons/icon32.png",
        "48": "icons/icon48.png",
        "128": "icons/icon128.png",
      },
      default_title: "Auto Price Converter",
    },
    permissions: ["storage", "activeTab"],
    host_permissions: ["https://apc-api.up.railway.app/*"],
    ...(browser === "firefox" && {
      browser_specific_settings: {
        gecko: {
          id: "auto-price-converter@xerrion.dev",
          strict_min_version: "140.0",
          data_collection_permissions: {
            required: ["none"],
          },
        },
      },
    }),
  }),

  vite: () => ({
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        $lib: path.resolve("./src/lib"),
      },
    },
    esbuild: {
      // Strip console.log and console.debug in production builds
      drop: process.env.NODE_ENV === "production" ? ["console", "debugger"] : [],
    },
  }),
});
