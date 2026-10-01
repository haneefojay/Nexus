import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { conditions: ["nexus-source"] },
  test: {
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
  },
});
