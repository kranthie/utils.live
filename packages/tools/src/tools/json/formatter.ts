import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError, extractJsonErrorPosition } from "../../core/errors";
import { JSON_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  /** JSON string to format */
  input: z.string().describe("JSON string to format"),
});

const outputSchema = z.object({
  /** Formatted JSON string */
  output: z.string().describe("Formatted JSON string"),
});

const optionsSchema = z.object({
  /** Number of spaces for indentation (0-8) */
  indent: z
    .number()
    .int()
    .min(0)
    .max(8)
    .default(2)
    .describe("Number of spaces for indentation"),
  /** Sort object keys alphabetically */
  sortKeys: z
    .boolean()
    .default(false)
    .describe("Sort object keys alphabetically"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Recursively sorts object keys alphabetically.
 */
function sortObjectKeys(value: unknown): unknown {
  if (value === null || typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(sortObjectKeys);
  }

  const sortedKeys = Object.keys(value).sort();
  const result: Record<string, unknown> = {};
  for (const key of sortedKeys) {
    result[key] = sortObjectKeys((value as Record<string, unknown>)[key]);
  }
  return result;
}

/**
 * Formats a JSON string with configurable indentation.
 */
function execute(input: Input, options?: Options): Output {
  const indent = options?.indent ?? 2;
  const shouldSortKeys = options?.sortKeys ?? false;

  try {
    const parsed: unknown = JSON.parse(input.input);
    const toStringify = shouldSortKeys ? sortObjectKeys(parsed) : parsed;
    const output = JSON.stringify(toStringify, null, indent);
    return { output };
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Invalid JSON format";
    const position = extractJsonErrorPosition(errorMessage);

    throw createToolError({
      code: JSON_PARSE_ERROR,
      message: `Invalid JSON: ${errorMessage}`,
      ...(position && { line: position.line, column: position.column }),
    });
  }
}

/**
 * JSON Formatter tool.
 * Formats JSON strings with configurable indentation and key sorting.
 */
export const jsonFormatter = defineTool({
  meta: {
    id: "json/formatter",
    name: "JSON Formatter",
    description:
      "Free online JSON formatter — prettify and format JSON with configurable indentation instantly in your browser. No data is stored. Supports 0-8 space indent and optional key sorting.",
    category: "json",
    subgroup: "Core",
    tier: ToolTier.CLIENT,
    keywords: [
      "json",
      "format",
      "prettify",
      "beautify",
      "indent",
      "pretty print",
      "json formatter online",
      "json beautifier",
      "pretty print json",
      "json validator",
    ],
    examples: [
      {
        title: "Minified to Pretty",
        description: "Format a compact JSON object with 2-space indentation",
        input:
          '{"name":"Alice","age":30,"roles":["admin","user"],"address":{"city":"Portland","state":"OR"}}',
        output:
          '{\n  "name": "Alice",\n  "age": 30,\n  "roles": [\n    "admin",\n    "user"\n  ],\n  "address": {\n    "city": "Portland",\n    "state": "OR"\n  }\n}',
      },
      {
        title: "API Response",
        description: "Pretty-print a typical REST API response payload",
        input:
          '{"status":"ok","data":{"id":1,"title":"Hello World","tags":["news","featured"]},"meta":{"page":1,"total":42}}',
        output:
          '{\n  "status": "ok",\n  "data": {\n    "id": 1,\n    "title": "Hello World",\n    "tags": [\n      "news",\n      "featured"\n    ]\n  },\n  "meta": {\n    "page": 1,\n    "total": 42\n  }\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
