import { z } from "zod";
import JSON5 from "json5";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { JSON5_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("JSON5 string to convert"),
});

const outputSchema = z.object({
  output: z.string().describe("Standard JSON string"),
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
 * Converts JSON5 to standard JSON using the json5 library.
 * Handles:
 * - // and /* comments
 * - Trailing commas
 * - Unquoted keys
 * - Single-quoted strings
 * - Hexadecimal numbers
 * - Leading/trailing decimal points
 * - Positive signs on numbers
 * - Infinity, -Infinity, NaN (converted to null by JSON.stringify)
 */
function execute(input: Input, options?: Options): Output {
  const indent = options?.indent ?? 2;

  try {
    const parsed: unknown = JSON5.parse(input.input);
    const output = JSON.stringify(parsed, null, indent);

    return { output };
  } catch (err) {
    throw createToolError({
      code: JSON5_PARSE_ERROR,
      message: `Invalid JSON5: ${err instanceof Error ? err.message : "Parse error"}`,
    });
  }
}

/**
 * JSON5 to JSON tool.
 * Converts JSON5 to standard JSON format.
 */
export const json5ToJson = defineTool({
  meta: {
    id: "data/json5-to-json",
    name: "JSON5 to JSON",
    description:
      "Free online JSON5 to JSON converter — convert JSON5 to standard JSON instantly in your browser. No data is stored. Strips comments (// /*), handles trailing commas, unquoted keys, single-quoted strings, and hex numbers.",
    category: "data",
    tier: ToolTier.CLIENT,
    keywords: [
      "json5",
      "json",
      "convert",
      "comments",
      "transform",
      "relaxed",
      "trailing-commas",
      "config",
    ],
    examples: [
      {
        title: "API config with comments and trailing commas",
        description:
          "Convert JSON5 with trailing commas and comments to standard JSON",
        input:
          '{\n  // API settings\n  url: "https://api.example.com",\n  timeout: 5000,\n  retries: 3,\n}',
        output:
          '{\n  "url": "https://api.example.com",\n  "timeout": 5000,\n  "retries": 3\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
