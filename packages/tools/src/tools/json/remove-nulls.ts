import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { JSON_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("JSON string to process"),
});

const optionsSchema = z.object({
  removeEmptyStrings: z
    .boolean()
    .default(false)
    .describe("Also remove empty strings"),
  removeEmptyArrays: z
    .boolean()
    .default(false)
    .describe("Also remove empty arrays"),
  removeEmptyObjects: z
    .boolean()
    .default(false)
    .describe("Also remove empty objects"),
  indent: z
    .number()
    .min(0)
    .max(8)
    .default(2)
    .describe("Indentation spaces for output"),
});

const outputSchema = z.object({
  output: z.string().describe("JSON with nulls removed"),
  removedCount: z.number().describe("Number of null values removed"),
});

type Input = z.infer<typeof inputSchema>;
type Options = z.infer<typeof optionsSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Recursively removes null values from an object or array.
 */
function removeNulls(
  value: unknown,
  options: Options,
  removedRef: { count: number }
): unknown {
  if (value === null) {
    removedRef.count++;
    return undefined;
  }

  if (Array.isArray(value)) {
    const filtered = value
      .map((item) => removeNulls(item, options, removedRef))
      .filter((item) => item !== undefined);

    if (options.removeEmptyArrays && filtered.length === 0) {
      removedRef.count++;
      return undefined;
    }
    return filtered;
  }

  if (typeof value === "object" && value !== null) {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      const cleaned = removeNulls(val, options, removedRef);
      if (cleaned !== undefined) {
        result[key] = cleaned;
      }
    }

    if (options.removeEmptyObjects && Object.keys(result).length === 0) {
      removedRef.count++;
      return undefined;
    }
    return result;
  }

  if (options.removeEmptyStrings && value === "") {
    removedRef.count++;
    return undefined;
  }

  return value;
}

/**
 * Removes null values from JSON.
 */
function execute(input: Input, options?: Options): Output {
  const opts = {
    removeEmptyStrings: options?.removeEmptyStrings ?? false,
    removeEmptyArrays: options?.removeEmptyArrays ?? false,
    removeEmptyObjects: options?.removeEmptyObjects ?? false,
    indent: options?.indent ?? 2,
  };
  try {
    const parsed: unknown = JSON.parse(input.input);
    const removedRef = { count: 0 };
    const cleaned = removeNulls(parsed, opts, removedRef);
    const output = JSON.stringify(cleaned, null, opts.indent);

    return {
      output,
      removedCount: removedRef.count,
    };
  } catch (err) {
    throw createToolError({
      code: JSON_PARSE_ERROR,
      message: `Invalid JSON: ${err instanceof Error ? err.message : "Parse error"}`,
    });
  }
}

/**
 * JSON Remove Nulls tool.
 * Removes null values from JSON objects and arrays.
 */
export const jsonRemoveNulls = defineTool({
  meta: {
    id: "json/remove-nulls",
    name: "JSON Remove Nulls",
    description:
      "Free online JSON null remover — strip null values from JSON objects and arrays instantly in your browser. No data is stored. Optionally removes empty strings, arrays, and objects.",
    category: "json",
    subgroup: "Core",
    tier: ToolTier.CLIENT,
    keywords: ["json", "null", "remove", "clean", "filter"],
    examples: [
      {
        title: "Clean Nulls",
        description: "Remove null values from a user profile object",
        input: '{"name": "Alice", "email": null, "age": 30, "phone": null}',
        output: '{\n  "name": "Alice",\n  "age": 30\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
