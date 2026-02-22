import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  framework: z
    .enum(["none", "react", "nextjs", "vue", "node"])
    .default("none")
    .describe("Framework"),
  typescript: z.boolean().default(true).describe("TypeScript support"),
  prettier: z.boolean().default(true).describe("Prettier integration"),
  style: z
    .enum(["recommended", "strict", "relaxed"])
    .default("recommended")
    .describe("Rule strictness"),
  format: z
    .enum(["flat", "legacy"])
    .default("flat")
    .describe("Config format (flat = eslint.config.js)"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated ESLint config"),
});

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  if (input.format === "flat") {
    const imports: string[] = ["import js from '@eslint/js';"];
    const configs: string[] = ["js.configs.recommended"];
    if (input.typescript) {
      imports.push("import tseslint from 'typescript-eslint';");
      configs.push("...tseslint.configs.recommended");
    }
    if (input.framework === "react" || input.framework === "nextjs") {
      imports.push("import react from 'eslint-plugin-react';");
      imports.push("import reactHooks from 'eslint-plugin-react-hooks';");
    }
    if (input.prettier) {
      imports.push("import prettier from 'eslint-config-prettier';");
      configs.push("prettier");
    }

    const rules: Record<string, unknown> = {};
    if (input.style === "strict") {
      rules["no-console"] = "error";
      rules["no-unused-vars"] = "error";
      rules["no-var"] = "error";
      rules["prefer-const"] = "error";
    } else if (input.style === "relaxed") {
      rules["no-console"] = "warn";
      rules["no-unused-vars"] = ["warn", { argsIgnorePattern: "^_" }];
    } else {
      rules["no-console"] = "warn";
      rules["no-unused-vars"] = ["error", { argsIgnorePattern: "^_" }];
      rules["prefer-const"] = "error";
    }

    const lines = [
      ...imports,
      "",
      "export default [",
      `  ${configs.join(",\n  ")},`,
      "  {",
      `    rules: ${JSON.stringify(rules, null, 6).replace(/\n/g, "\n    ")}`,
      "  },",
      "];",
    ];
    return { output: lines.join("\n") };
  }

  // Legacy format
  const config: Record<string, unknown> = {};
  const exts: string[] = ["eslint:recommended"];
  if (input.typescript) exts.push("plugin:@typescript-eslint/recommended");
  if (input.framework === "react" || input.framework === "nextjs")
    exts.push("plugin:react/recommended", "plugin:react-hooks/recommended");
  if (input.framework === "nextjs") exts.push("next/core-web-vitals");
  if (input.prettier) exts.push("prettier");

  config.extends = exts;
  config.parser = input.typescript ? "@typescript-eslint/parser" : undefined;
  config.plugins = input.typescript ? ["@typescript-eslint"] : [];
  config.env = { browser: true, es2022: true, node: true };
  config.rules = { "no-console": "warn", "prefer-const": "error" };

  return { output: JSON.stringify(config, null, 2) };
}

export const eslintConfigGenerator = defineTool({
  meta: {
    id: "code/eslint-config-generator",
    name: "ESLint Config Generator",
    description:
      "Free online ESLint config generator — create flat or legacy ESLint configuration with TypeScript, React, Vue, Prettier integration, and rule strictness presets instantly in your browser. No data is stored.",
    category: "code",
    subgroup: "Config Generators",
    tier: ToolTier.CLIENT,
    keywords: [
      "eslint",
      "config",
      "lint",
      "generate",
      "javascript",
      "typescript",
    ],
    examples: [
      {
        title: "TypeScript + Prettier config",
        description:
          "Generate a flat ESLint config for TypeScript with Prettier",
        input: {
          framework: "none",
          typescript: true,
          prettier: true,
          style: "recommended",
          format: "flat",
        },
        output:
          'import js from \'@eslint/js\';\nimport tseslint from \'typescript-eslint\';\nimport prettier from \'eslint-config-prettier\';\n\nexport default [\n  js.configs.recommended,\n  ...tseslint.configs.recommended,\n  prettier,\n  {\n    rules: {\n          "no-console": "warn",\n          "no-unused-vars": [\n                "error",\n                {\n                      "argsIgnorePattern": "^_"\n                }\n          ],\n          "prefer-const": "error"\n    }\n  },\n];',
      },
    ],
    ui: { outputLanguage: "javascript" },
  },
  inputSchema,
  outputSchema,
  execute,
});
