import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/index.ts",
        "src/**/*.d.ts",
        // Type-only files with no runtime code (interfaces only)
        "src/types/category.ts",
        "src/types/credit.ts",
        "src/types/error.ts",
        "src/types/execution-meta.ts",
        "src/types/options.ts",
        "src/types/result.ts",
        "src/types/tool-definition.ts",
        "src/types/tool-meta.ts",
        "src/types/tool.ts",
      ],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
