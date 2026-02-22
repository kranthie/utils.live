import { z } from "zod";
import jmespath from "jmespath";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { JSON_PARSE_ERROR, JSON_PATH_NOT_FOUND } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("JSON string to query"),
});

const optionsSchema = z.object({
  expression: z.string().default("@").describe("JMESPath expression"),
  indent: z
    .number()
    .min(0)
    .max(8)
    .default(2)
    .describe("Indentation spaces for output"),
});

const outputSchema = z.object({
  output: z.string().describe("Query result as JSON string"),
  type: z.string().describe("Type of the result"),
});

type Input = z.infer<typeof inputSchema>;
type Options = z.infer<typeof optionsSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Get the type of a JSON value.
 */
function getJsonType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

/**
 * Queries JSON using JMESPath expression.
 */
function execute(input: Input, options?: Options): Output {
  const expression = options?.expression ?? "@";
  const indent = options?.indent ?? 2;

  let parsed: unknown;
  try {
    parsed = JSON.parse(input.input);
  } catch (err) {
    throw createToolError({
      code: JSON_PARSE_ERROR,
      message: `Invalid JSON: ${err instanceof Error ? err.message : "Parse error"}`,
    });
  }

  let result: unknown;
  try {
    result = jmespath.search(parsed, expression);
  } catch (err) {
    throw createToolError({
      code: JSON_PATH_NOT_FOUND,
      message: `Invalid JMESPath expression: ${err instanceof Error ? err.message : "Query error"}`,
    });
  }

  if (result === null || result === undefined) {
    return {
      output: "null",
      type: "null",
    };
  }

  const output = JSON.stringify(result, null, indent);
  const type = getJsonType(result);

  return { output, type };
}

/**
 * JSON JMESPath tool.
 * Queries JSON using JMESPath expressions.
 */
export const jsonJmespath = defineTool({
  meta: {
    id: "json/jmespath",
    name: "JSON JMESPath",
    description:
      "Free online JMESPath query tool — filter and transform JSON using JMESPath expressions instantly in your browser. No data is stored. Supports dot notation, array slicing, projections, and functions.",
    category: "json",
    subgroup: "Core",
    tier: ToolTier.CLIENT,
    keywords: ["json", "jmespath", "query", "filter", "select"],
    examples: [
      {
        title: "Extract Nested Field",
        description:
          "Query a nested field from a JSON object using dot notation",
        input:
          '{"store": {"name": "BookShop", "location": {"city": "Portland", "state": "OR"}}}',
        options: { expression: "store.location.city" },
        output: '"Portland"',
      },
      {
        title: "Filter Array",
        description: "Select names of users older than 25 from an array",
        input:
          '{"users": [{"name": "Alice", "age": 30}, {"name": "Bob", "age": 22}, {"name": "Carol", "age": 28}]}',
        options: { expression: "users[?age > `25`].name" },
        output: '[\n  "Alice",\n  "Carol"\n]',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
