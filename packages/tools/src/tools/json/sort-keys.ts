import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { JSON_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("JSON string to sort"),
});

const outputSchema = z.object({
  output: z.string().describe("JSON string with sorted keys"),
});

const optionsSchema = z.object({
  order: z
    .enum(["asc", "desc"])
    .default("asc")
    .describe("Sort order: ascending or descending"),
  deep: z
    .boolean()
    .default(true)
    .describe("Sort keys recursively in nested objects"),
  indent: z
    .number()
    .int()
    .min(0)
    .max(8)
    .default(2)
    .describe("Indentation spaces"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

function sortObjectKeys(
  value: unknown,
  order: "asc" | "desc",
  deep: boolean
): unknown {
  if (value === null || typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    return deep
      ? value.map((item) => sortObjectKeys(item, order, deep))
      : value;
  }

  const keys = Object.keys(value);
  const sortedKeys = keys.sort((a, b) => {
    const comparison = a.localeCompare(b);
    return order === "desc" ? -comparison : comparison;
  });

  const result: Record<string, unknown> = {};
  for (const key of sortedKeys) {
    const val = (value as Record<string, unknown>)[key];
    result[key] = deep ? sortObjectKeys(val, order, deep) : val;
  }

  return result;
}

/**
 * Sorts object keys in JSON.
 */
function execute(input: Input, options?: Options): Output {
  const order = options?.order ?? "asc";
  const deep = options?.deep ?? true;
  const indent = options?.indent ?? 2;

  try {
    const parsed: unknown = JSON.parse(input.input);
    const sorted = sortObjectKeys(parsed, order, deep);
    const output = JSON.stringify(sorted, null, indent);

    return { output };
  } catch (err) {
    throw createToolError({
      code: JSON_PARSE_ERROR,
      message: `Invalid JSON: ${err instanceof Error ? err.message : "Parse error"}`,
    });
  }
}

/**
 * JSON Sort Keys tool.
 * Sorts object keys alphabetically.
 */
export const jsonSortKeys = defineTool({
  meta: {
    id: "json/sort-keys",
    name: "JSON Sort Keys",
    description:
      "Free online JSON key sorter — sort object keys alphabetically in ascending or descending order instantly in your browser. No data is stored. Supports recursive sorting of nested objects.",
    category: "json",
    subgroup: "Core",
    tier: ToolTier.CLIENT,
    keywords: ["json", "sort", "keys", "alphabetical", "order"],
    examples: [
      {
        title: "Sort Keys A-Z",
        description: "Sort object keys in ascending alphabetical order",
        input: '{"zebra": 1, "apple": 2, "mango": 3}',
        output: '{\n  "apple": 2,\n  "mango": 3,\n  "zebra": 1\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
