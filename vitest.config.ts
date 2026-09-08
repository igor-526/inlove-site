import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const dirname = typeof __dirname !== "undefined"
  ? __dirname
  : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: [{ find: "@", replacement: path.resolve(dirname, "src") }],
  },
  test: {
    projects: [{
      extends: true,
      test: {
        name: "unit",
        environment: "node",
        include: ["src/**/*.test.{ts,tsx}"],
      },
    }],
  },
});
