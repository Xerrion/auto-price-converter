import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { resolve } from "path";
import {
  copyFileSync,
  mkdirSync,
  existsSync,
  rmSync,
  readFileSync,
  writeFileSync,
} from "fs";

// Custom plugin to copy manifest.json, icons, and fix HTML output paths
function copyExtensionFiles() {
  return {
    name: "copy-extension-files",
    closeBundle() {
      const distDir = resolve(__dirname, "dist");
      if (!existsSync(distDir)) {
        mkdirSync(distDir, { recursive: true });
      }

      // Copy manifest
      copyFileSync(
        resolve(__dirname, "src/manifest.json"),
        resolve(distDir, "manifest.json"),
      );

      // Copy icons if they exist
      const iconsDir = resolve(__dirname, "src/icons");
      const distIconsDir = resolve(distDir, "icons");
      if (existsSync(iconsDir)) {
        if (!existsSync(distIconsDir)) {
          mkdirSync(distIconsDir, { recursive: true });
        }
        ["icon16.png", "icon32.png", "icon48.png", "icon128.png"].forEach(
          (icon) => {
            const srcIcon = resolve(iconsDir, icon);
            if (existsSync(srcIcon)) {
              copyFileSync(srcIcon, resolve(distIconsDir, icon));
            }
          },
        );
      }

      // Move HTML files from dist/src/* to dist/* and fix paths
      const srcDistDir = resolve(distDir, "src");
      if (existsSync(srcDistDir)) {
        ["popup", "options"].forEach((dir) => {
          const srcHtmlDir = resolve(srcDistDir, dir);
          const destDir = resolve(distDir, dir);
          if (existsSync(srcHtmlDir)) {
            const htmlFile = resolve(srcHtmlDir, "index.html");
            if (existsSync(htmlFile)) {
              if (!existsSync(destDir)) {
                mkdirSync(destDir, { recursive: true });
              }
              // Read HTML, fix paths (../../ to ../) and write to dest
              let html = readFileSync(htmlFile, "utf-8");
              html = html.replace(/\.\.\/\.\.\//g, "../");
              writeFileSync(resolve(destDir, "index.html"), html);
            }
          }
        });
        // Clean up src directory in dist
        rmSync(srcDistDir, { recursive: true, force: true });
      }
    },
  };
}

export default defineConfig({
  plugins: [svelte(), copyExtensionFiles()],
  base: "",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/popup/index.html"),
        options: resolve(__dirname, "src/options/index.html"),
        background: resolve(__dirname, "src/background/index.ts"),
        content: resolve(__dirname, "src/content/index.ts"),
      },
      output: {
        entryFileNames: "[name]/index.js",
        chunkFileNames: "chunks/[name].[hash].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith(".css")) {
            return "[name]/[name].[ext]";
          }
          return "assets/[name].[ext]";
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
