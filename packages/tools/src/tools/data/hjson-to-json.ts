import { z } from "zod";
import Hjson from "hjson";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { HJSON_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("HJSON (Human JSON) string to convert"),
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
 * Converts HJSON (Human JSON) to standard JSON using the hjson library.
 * Handles:
 * - // and /* comments
 * - # comments
 * - Trailing commas
 * - Unquoted keys
 * - Multi-line strings (''')
 * - Unquoted string values
 */
function execute(input: Input, options?: Options): Output {
  const indent = options?.indent ?? 2;

  try {
    const parsed: unknown = Hjson.parse(input.input);
    const output = JSON.stringify(parsed, null, indent);

    return { output };
  } catch (err) {
    throw createToolError({
      code: HJSON_PARSE_ERROR,
      message: `Invalid HJSON: ${err instanceof Error ? err.message : "Parse error"}`,
    });
  }
}

/**
 * HJSON to JSON tool.
 * Converts HJSON (Human JSON) to standard JSON format.
 */
export const hjsonToJson = defineTool({
  meta: {
    id: "data/hjson-to-json",
    name: "HJSON to JSON",
    description:
      "Free online HJSON to JSON converter — convert Human JSON to standard JSON instantly in your browser. No data is stored. Strips comments (// /* #), handles trailing commas, unquoted keys, and multi-line strings.",
    category: "data",
    tier: ToolTier.CLIENT,
    keywords: [
      "hjson",
      "json",
      "convert",
      "human",
      "comments",
      "transform",
      "trailing-commas",
      "unquoted-keys",
      "config",
    ],
    examples: [
      {
        title: "Database config with comments and unquoted keys",
        description:
          "Convert HJSON with comments and unquoted keys to standard JSON",
        input:
          '{\n  // Database config\n  host: localhost\n  port: 5432\n  name: "mydb"\n}',
        output:
          '{\n  "host": "localhost",\n  "port": 5432,\n  "name": "mydb"\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
