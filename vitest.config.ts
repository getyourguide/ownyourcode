// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      reporter: ["json-summary"],
      include: ["**/*.ts"],
      all: true,
    },
  },
});
