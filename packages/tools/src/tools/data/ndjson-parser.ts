import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import {
  NDJSON_PARSE_ERROR,
  NDJSON_INVALID_LINE,
} from "../../core/error-codes";

const inputSchema = z.object({
  input: z
    .string()
    .describe("NDJSON string to parse (one JSON object per line)"),
});

const outputSchema = z.object({
  output: z.string().describe("JSON array string containing parsed objects"),
  lineCount: z.number().describe("Number of lines successfully parsed"),
  errors: z
    .array(
      z.object({
        line: z.number().describe("Line number (1-indexed)"),
        error: z.string().describe("Error message"),
      })
    )
    .describe(
      "Parse errors for skipped invalid lines (when skipInvalid is true)"
    ),
});

const optionsSchema = z.object({
  indent: z
    .number()
    .int()
    .min(0)
    .max(8)
    .default(2)
    .describe("JSON indentation spaces"),
  skipEmpty: z.boolean().default(true).describe("Skip empty lines"),
  skipInvalid: z
    .boolean()
    .default(false)
    .describe("Skip invalid JSON lines instead of failing"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Parses NDJSON (Newline Delimited JSON) to a JSON array.
 */
function execute(input: Input, options?: Options): Output {
  const indent = options?.indent ?? 2;
  const skipEmpty = options?.skipEmpty ?? true;
  const skipInvalid = options?.skipInvalid ?? false;

  const lines = input.input.split("\n");
  const result: unknown[] = [];
  const errors: { line: number; error: string }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    if (rawLine === undefined) continue;
    const line = rawLine.trim();

    // Skip empty lines if configured
    if (!line) {
      if (skipEmpty) {
        continue;
      }
      // Empty lines that shouldn't be skipped are invalid
      if (!skipInvalid) {
        throw createToolError({
          code: NDJSON_INVALID_LINE,
          message: `Empty line at line ${i + 1}`,
        });
      }
      continue;
    }

    try {
      const parsed: unknown = JSON.parse(line);
      result.push(parsed);
    } catch (err) {
      if (skipInvalid) {
        errors.push({
          line: i + 1,
          error: err instanceof Error ? err.message : "Parse error",
        });
        continue;
      }
      throw createToolError({
        code: NDJSON_PARSE_ERROR,
        message: `Invalid JSON at line ${i + 1}: ${err instanceof Error ? err.message : "Parse error"}`,
      });
    }
  }

  const output = JSON.stringify(result, null, indent);

  return {
    output,
    lineCount: result.length,
    errors,
  };
}

/**
 * NDJSON Parser tool.
 * Parses NDJSON (Newline Delimited JSON) to a JSON array.
 */
export const ndjsonParser = defineTool({
  meta: {
    id: "data/ndjson-parser",
    name: "NDJSON Parser",
    description:
      "Free online NDJSON parser — convert newline-delimited JSON (JSONL) to a JSON array instantly in your browser. No data is stored. Parses each line as a separate JSON value, with options to skip empty or invalid lines.",
    category: "data",
    tier: ToolTier.CLIENT,
    keywords: [
      "ndjson",
      "jsonl",
      "json",
      "parse",
      "newline",
      "delimited",
      "stream",
      "log",
      "bigquery",
    ],
    examples: [
      {
        title: "User records from NDJSON log lines",
        description: "Parse newline-delimited JSON lines into a JSON array",
        input: '{"id":1,"name":"Alice"}\n{"id":2,"name":"Bob"}',
        output:
          '[\n  {\n    "id": 1,\n    "name": "Alice"\n  },\n  {\n    "id": 2,\n    "name": "Bob"\n  }\n]',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
