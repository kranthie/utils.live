import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { JSON_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("JSON string to flatten"),
});

const outputSchema = z.object({
  output: z.string().describe("Flattened JSON string"),
  keyCount: z.number().describe("Number of keys in flattened object"),
});

const optionsSchema = z.object({
  delimiter: z.string().default(".").describe("Delimiter for nested keys"),
  maxDepth: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe("Maximum depth to flatten"),
  flattenArrays: z
    .boolean()
    .default(true)
    .describe("Flatten arrays with [index] notation"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

function flattenObject(
  obj: unknown,
  delimiter: string,
  maxDepth: number | undefined,
  flattenArrays: boolean,
  prefix: string = "",
  depth: number = 0,
  result: Record<string, unknown> = {}
): Record<string, unknown> {
  if (maxDepth !== undefined && depth >= maxDepth) {
    result[prefix] = obj;
    return result;
  }

  if (obj === null || typeof obj !== "object") {
    result[prefix] = obj;
    return result;
  }

  if (Array.isArray(obj)) {
    if (!flattenArrays) {
      result[prefix] = obj;
      return result;
    }
    for (let i = 0; i < obj.length; i++) {
      const newKey = prefix ? `${prefix}[${i}]` : `[${i}]`;
      flattenObject(
        obj[i],
        delimiter,
        maxDepth,
        flattenArrays,
        newKey,
        depth + 1,
        result
      );
    }
    if (obj.length === 0) {
      result[prefix] = [];
    }
    return result;
  }

  const entries = Object.entries(obj);
  if (entries.length === 0) {
    result[prefix] = {};
    return result;
  }

  for (const [key, value] of entries) {
    const newKey = prefix ? `${prefix}${delimiter}${key}` : key;
    flattenObject(
      value,
      delimiter,
      maxDepth,
      flattenArrays,
      newKey,
      depth + 1,
      result
    );
  }

  return result;
}

/**
 * Flattens nested JSON into a single-level object.
 */
function execute(input: Input, options?: Options): Output {
  const delimiter = options?.delimiter ?? ".";
  const maxDepth = options?.maxDepth;
  const flattenArrays = options?.flattenArrays ?? true;

  try {
    const parsed: unknown = JSON.parse(input.input);
    const flattened = flattenObject(parsed, delimiter, maxDepth, flattenArrays);
    const output = JSON.stringify(flattened, null, 2);

    return {
      output,
      keyCount: Object.keys(flattened).length,
    };
  } catch (err) {
    throw createToolError({
      code: JSON_PARSE_ERROR,
      message: `Invalid JSON: ${err instanceof Error ? err.message : "Parse error"}`,
    });
  }
}

/**
 * JSON Flatten tool.
 * Flattens nested JSON into a single-level object.
 */
export const jsonFlatten = defineTool({
  meta: {
    id: "json/flatten",
    name: "JSON Flatten",
    description:
      "Free online JSON flattener — convert nested JSON into a single-level object with dot-notation keys instantly in your browser. No data is stored. Configurable delimiter, max depth, and array handling.",
    category: "json",
    subgroup: "Core",
    tier: ToolTier.CLIENT,
    keywords: ["json", "flatten", "nested", "denormalize", "dot notation"],
    examples: [
      {
        title: "Nested Object",
        description: "Flatten a nested object into dot-notation keys",
        input:
          '{"user":{"name":"Alice","address":{"city":"Portland","zip":"97201"}},"active":true}',
        output:
          '{\n  "user.name": "Alice",\n  "user.address.city": "Portland",\n  "user.address.zip": "97201",\n  "active": true\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
