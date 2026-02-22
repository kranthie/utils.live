import { z } from "zod";
import TOML from "@iarna/toml";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { TOML_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("TOML string to convert to JSON"),
});

const outputSchema = z.object({
  output: z.string().describe("JSON string"),
});

const optionsSchema = z.object({
  indent: z
    .number()
    .int()
    .min(0)
    .max(8)
    .default(2)
    .describe("JSON indentation spaces"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Converts TOML to JSON format.
 */
function execute(input: Input, options?: Options): Output {
  const indent = options?.indent ?? 2;

  try {
    const parsed = TOML.parse(input.input);
    const output = JSON.stringify(parsed, null, indent);

    return { output };
  } catch (err) {
    throw createToolError({
      code: TOML_PARSE_ERROR,
      message: `Invalid TOML: ${err instanceof Error ? err.message : "Parse error"}`,
    });
  }
}

/**
 * TOML to JSON tool.
 * Converts TOML to JSON format.
 */
export const tomlToJson = defineTool({
  meta: {
    id: "toml/to-json",
    name: "TOML to JSON",
    description:
      "Free online TOML to JSON converter — paste your TOML config and get JSON output instantly in your browser. No data is stored. Handles nested tables, arrays, inline tables, and all TOML data types.",
    category: "toml",
    tier: ToolTier.CLIENT,
    keywords: [
      "toml",
      "json",
      "convert",
      "transform",
      "config",
      "configuration",
      "cargo",
      "pyproject",
      "parser",
    ],
    examples: [
      {
        title: "Cargo.toml package config",
        description:
          "Convert a Rust Cargo.toml package section with dependencies to JSON",
        input:
          '[package]\nname = "my-app"\nversion = "0.1.0"\nedition = "2021"\n\n[dependencies]\nserde = { version = "1.0", features = ["derive"] }\ntokio = { version = "1", features = ["full"] }',
        output:
          '{\n  "package": {\n    "name": "my-app",\n    "version": "0.1.0",\n    "edition": "2021"\n  },\n  "dependencies": {\n    "serde": {\n      "version": "1.0",\n      "features": [\n        "derive"\n      ]\n    },\n    "tokio": {\n      "version": "1",\n      "features": [\n        "full"\n      ]\n    }\n  }\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
