import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { JSON_PARSE_ERROR, INPUT_INVALID_TYPE } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("JSON array string to convert to NDJSON"),
});

const outputSchema = z.object({
  output: z.string().describe("NDJSON string (one JSON object per line)"),
  lineCount: z.number().describe("Number of lines generated"),
});

const optionsSchema = z.object({
  compact: z
    .boolean()
    .default(true)
    .describe("Minify each line (no extra whitespace)"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Converts a JSON array to NDJSON (Newline Delimited JSON) format.
 */
function execute(input: Input, options?: Options): Output {
  const compact = options?.compact ?? true;

  let parsed: unknown;
  try {
    parsed = JSON.parse(input.input);
  } catch (err) {
    throw createToolError({
      code: JSON_PARSE_ERROR,
      message: `Invalid JSON: ${err instanceof Error ? err.message : "Parse error"}`,
    });
  }

  if (!Array.isArray(parsed)) {
    throw createToolError({
      code: INPUT_INVALID_TYPE,
      message: "Input must be a JSON array",
    });
  }

  const lines = parsed.map((item) => {
    if (compact) {
      return JSON.stringify(item);
    }
    // Non-compact: add spaces after colons and commas for readability
    // while keeping each item on a single line (required for NDJSON format)
    return JSON.stringify(item).replace(/,/g, ", ").replace(/:/g, ": ");
  });

  const output = lines.join("\n");

  return {
    output,
    lineCount: lines.length,
  };
}

/**
 * JSON to NDJSON tool.
 * Converts a JSON array to NDJSON (Newline Delimited JSON) format.
 */
export const jsonToNdjson = defineTool({
  meta: {
    id: "data/json-to-ndjson",
    name: "JSON to NDJSON",
    description:
      "Free online JSON to NDJSON converter — convert JSON arrays to newline-delimited JSON (JSONL) format instantly in your browser. No data is stored. Outputs one JSON object per line for streaming, logging, and big data pipelines.",
    category: "data",
    tier: ToolTier.CLIENT,
    keywords: [
      "json",
      "ndjson",
      "jsonl",
      "convert",
      "newline",
      "delimited",
      "stream",
      "log",
      "bigquery",
    ],
    examples: [
      {
        title: "User records array to NDJSON lines",
        description:
          "Convert a JSON array of objects to newline-delimited JSON",
        input: '[{"id":1,"name":"Alice"},{"id":2,"name":"Bob"}]',
        output: '{"id":1,"name":"Alice"}\n{"id":2,"name":"Bob"}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
