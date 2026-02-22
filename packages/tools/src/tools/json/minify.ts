import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { JSON_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("JSON string to minify"),
});

const outputSchema = z.object({
  output: z.string().describe("Minified JSON string"),
  originalSize: z.number().describe("Original size in bytes"),
  minifiedSize: z.number().describe("Minified size in bytes"),
  reduction: z.number().describe("Size reduction percentage"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Minifies JSON by removing all whitespace and formatting.
 */
function execute(input: Input): Output {
  const originalSize = new TextEncoder().encode(input.input).length;

  try {
    const parsed: unknown = JSON.parse(input.input);
    const output = JSON.stringify(parsed);
    const minifiedSize = new TextEncoder().encode(output).length;
    const reduction =
      originalSize > 0
        ? Math.round(((originalSize - minifiedSize) / originalSize) * 100)
        : 0;

    return {
      output,
      originalSize,
      minifiedSize,
      reduction,
    };
  } catch (err) {
    throw createToolError({
      code: JSON_PARSE_ERROR,
      message: `Invalid JSON: ${err instanceof Error ? err.message : "Parse error"}`,
    });
  }
}

/**
 * JSON Minify tool.
 * Removes all whitespace and formatting from JSON.
 */
export const jsonMinify = defineTool({
  meta: {
    id: "json/minify",
    name: "JSON Minify",
    description:
      "Free online JSON minifier — compress JSON by removing all whitespace and formatting instantly in your browser. No data is stored. Shows original vs minified size and reduction percentage.",
    category: "json",
    subgroup: "Core",
    tier: ToolTier.CLIENT,
    keywords: ["json", "minify", "compact", "compress", "whitespace"],
    examples: [
      {
        title: "Compact Object",
        description: "Remove all whitespace from a formatted JSON object",
        input: '{\n  "name": "Alice",\n  "age": 30,\n  "active": true\n}',
        output: '{"name":"Alice","age":30,"active":true}',
      },
      {
        title: "Nested Structure",
        description: "Minify a nested JSON structure to save space",
        input:
          '{\n  "users": [\n    {\n      "id": 1,\n      "name": "Bob"\n    },\n    {\n      "id": 2,\n      "name": "Carol"\n    }\n  ]\n}',
        output: '{"users":[{"id":1,"name":"Bob"},{"id":2,"name":"Carol"}]}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
