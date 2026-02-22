import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { extractJsonErrorPosition } from "../../core/errors";

const inputSchema = z.object({
  /** JSON string to validate */
  input: z.string().describe("JSON string to validate"),
});

const outputSchema = z.object({
  /** Whether the JSON is valid */
  valid: z.boolean().describe("Whether the JSON is valid"),
  /** Error message if invalid */
  error: z.string().optional().describe("Error message if invalid"),
  /** Line number of error if available */
  line: z.number().optional().describe("Line number of error"),
  /** Column number of error if available */
  column: z.number().optional().describe("Column number of error"),
  /** Parsed JSON type (object, array, string, number, boolean, null) */
  type: z.string().optional().describe("Type of the parsed JSON value"),
  /** Number of keys (for objects) or items (for arrays) */
  size: z.number().optional().describe("Number of keys or array items"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Gets the JSON type name.
 */
function getJsonType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

/**
 * Gets the size of a JSON value (keys for objects, length for arrays).
 */
function getJsonSize(value: unknown): number | undefined {
  if (value === null || typeof value !== "object") return undefined;
  if (Array.isArray(value)) return value.length;
  return Object.keys(value).length;
}

/**
 * Validates a JSON string and returns detailed information.
 */
function execute(input: Input): Output {
  try {
    const parsed: unknown = JSON.parse(input.input);
    return {
      valid: true,
      type: getJsonType(parsed),
      size: getJsonSize(parsed),
    };
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Invalid JSON format";
    const position = extractJsonErrorPosition(errorMessage);

    return {
      valid: false,
      error: errorMessage,
      line: position?.line,
      column: position?.column,
    };
  }
}

/**
 * JSON Validator tool.
 * Validates JSON strings and provides detailed error information.
 */
export const jsonValidator = defineTool({
  meta: {
    id: "json/validator",
    name: "JSON Validator",
    description:
      "Free online JSON validator — check JSON syntax and get detailed error information instantly in your browser. No data is stored. Reports error line/column position and detected JSON type.",
    category: "json",
    subgroup: "Core",
    tier: ToolTier.CLIENT,
    keywords: ["json", "validate", "check", "verify", "lint", "syntax"],
    examples: [
      {
        title: "Valid JSON",
        description: "A well-formed JSON object passes validation",
        input: '{"name": "Alice", "age": 30, "active": true}',
        output: '{\n  "valid": true,\n  "type": "object",\n  "size": 3\n}',
      },
      {
        title: "Invalid JSON",
        description: "A JSON string with a trailing comma fails validation",
        input: '{"name": "Alice", "age": 30,}',
        output:
          '{\n  "valid": false,\n  "error": "Expected double-quoted property name in JSON at position 28 (line 1 column 29)",\n  "line": 1,\n  "column": 29\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
