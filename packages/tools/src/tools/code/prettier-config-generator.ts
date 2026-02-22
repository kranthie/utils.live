import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  printWidth: z.number().min(40).max(200).default(80).describe("Print width"),
  tabWidth: z.number().min(1).max(8).default(2).describe("Tab width"),
  useTabs: z.boolean().default(false).describe("Use tabs instead of spaces"),
  semi: z.boolean().default(true).describe("Add semicolons"),
  singleQuote: z.boolean().default(false).describe("Use single quotes"),
  trailingComma: z
    .enum(["all", "es5", "none"])
    .default("all")
    .describe("Trailing commas"),
  bracketSpacing: z
    .boolean()
    .default(true)
    .describe("Spaces in object literals"),
  arrowParens: z
    .enum(["always", "avoid"])
    .default("always")
    .describe("Arrow function parens"),
  endOfLine: z
    .enum(["lf", "crlf", "cr", "auto"])
    .default("lf")
    .describe("Line endings"),
  jsxSingleQuote: z.boolean().default(false).describe("Single quotes in JSX"),
  format: z
    .enum(["json", "js", "yaml"])
    .default("json")
    .describe("Config file format"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated Prettier config"),
});

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  const config: Record<string, unknown> = {
    printWidth: input.printWidth,
    tabWidth: input.tabWidth,
    useTabs: input.useTabs,
    semi: input.semi,
    singleQuote: input.singleQuote,
    trailingComma: input.trailingComma,
    bracketSpacing: input.bracketSpacing,
    arrowParens: input.arrowParens,
    endOfLine: input.endOfLine,
    jsxSingleQuote: input.jsxSingleQuote,
  };

  switch (input.format) {
    case "js":
      return {
        output: `/** @type {import("prettier").Config} */\nmodule.exports = ${JSON.stringify(config, null, 2)};`,
      };
    case "yaml": {
      const lines = Object.entries(config).map(
        ([k, v]) => `${k}: ${JSON.stringify(v)}`
      );
      return { output: lines.join("\n") };
    }
    default:
      return { output: JSON.stringify(config, null, 2) };
  }
}

export const prettierConfigGenerator = defineTool({
  meta: {
    id: "code/prettier-config-generator",
    name: "Prettier Config Generator",
    description:
      "Free online Prettier config generator — create Prettier configuration with print width, quotes, semicolons, trailing commas, and more instantly in your browser. No data is stored. Outputs JSON, JS module, or YAML format.",
    category: "code",
    subgroup: "Config Generators",
    tier: ToolTier.CLIENT,
    keywords: ["prettier", "config", "format", "generate", "code style"],
    examples: [
      {
        title: "Standard Prettier config",
        description:
          "Generate a Prettier config with single quotes and no semicolons",
        input: {
          printWidth: 100,
          tabWidth: 2,
          useTabs: false,
          semi: false,
          singleQuote: true,
          trailingComma: "all",
          bracketSpacing: true,
          arrowParens: "always",
          endOfLine: "lf",
          jsxSingleQuote: false,
          format: "json",
        },
        output:
          '{\n  "printWidth": 100,\n  "tabWidth": 2,\n  "useTabs": false,\n  "semi": false,\n  "singleQuote": true,\n  "trailingComma": "all",\n  "bracketSpacing": true,\n  "arrowParens": "always",\n  "endOfLine": "lf",\n  "jsxSingleQuote": false\n}',
      },
    ],
    ui: { outputLanguage: "json" },
  },
  inputSchema,
  outputSchema,
  execute,
});
