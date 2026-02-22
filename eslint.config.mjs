import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";
import nextConfig from "eslint-config-next";
import globals from "globals";

export default tseslint.config(
  // Global ignores (replaces .eslintignore and ignorePatterns)
  {
    ignores: [
      "**/node_modules/",
      "**/dist/",
      "**/.next/",
      "**/coverage/",
      "**/*.config.js",
      "**/*.config.mjs",
      "**/public/**",
      "specs/**/*.ts",
      "docs/**/*.ts",
      "out/**",
      "**/out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },

  // Base recommended configs
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,

  // Next.js config — scoped to web app only (not tools/mcp/ui packages)
  ...nextConfig.map((config) => ({
    ...config,
    files: ["apps/web/**/*.{ts,tsx,js,jsx}"],
  })),

  // Prettier must come last to disable conflicting rules
  prettierConfig,

  // Shared language options and custom rules
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2022,
      },
      parserOptions: {
        project: [
          "./tsconfig.json",
          "./apps/*/tsconfig.json",
          "./packages/*/tsconfig.json",
        ],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      next: {
        rootDir: "apps/web",
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
          allowDirectConstAssertionInArrowFunctions: true,
        },
      ],
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },

  // Disable type-checked rules for JavaScript files (they don't use the TS parser)
  {
    files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
    ...tseslint.configs.disableTypeChecked,
    rules: {
      ...tseslint.configs.disableTypeChecked.rules,
      "@typescript-eslint/consistent-type-imports": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
    },
  }
);
