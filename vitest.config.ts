import { defineConfig } from "vitest/config";
import * as path from "node:path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      $lib: path.resolve("./src/lib"),
    },
  },
});
