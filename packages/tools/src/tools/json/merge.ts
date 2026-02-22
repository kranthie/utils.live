import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { JSON_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("First JSON object to merge"),
});

const optionsSchema = z.object({
  second: z
    .string()
    .default("{}")
    .describe("Second JSON object to merge into the first"),
  deep: z
    .boolean()
    .default(true)
    .describe("Deep merge nested objects (otherwise shallow)"),
  arrayStrategy: z
    .enum(["replace", "concat", "unique"])
    .default("replace")
    .describe("How to handle arrays: replace, concat, or unique"),
  indent: z
    .number()
    .min(0)
    .max(8)
    .default(2)
    .describe("Indentation spaces for output"),
});

const outputSchema = z.object({
  output: z.string().describe("Merged JSON result"),
});

type Input = z.infer<typeof inputSchema>;
type Options = z.infer<typeof optionsSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Deep merge two values with configurable array strategy.
 */
function deepMerge(
  target: unknown,
  source: unknown,
  options: Options
): unknown {
  // If source is null/undefined, return target
  if (source === null || source === undefined) {
    return target;
  }

  // If target is null/undefined, return source
  if (target === null || target === undefined) {
    return source;
  }

  // Handle arrays
  if (Array.isArray(target) && Array.isArray(source)) {
    const targetArr = target as unknown[];
    const sourceArr = source as unknown[];
    switch (options.arrayStrategy) {
      case "concat":
        return [...targetArr, ...sourceArr];
      case "unique": {
        const seen = new Set<string>();
        return [...targetArr, ...sourceArr].filter((item) => {
          const key = JSON.stringify(item);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      }
      case "replace":
      default:
        return source;
    }
  }

  // Handle objects
  if (
    typeof target === "object" &&
    typeof source === "object" &&
    !Array.isArray(target) &&
    !Array.isArray(source)
  ) {
    if (!options.deep) {
      return { ...target, ...source };
    }

    const result: Record<string, unknown> = { ...target };
    for (const key of Object.keys(source)) {
      const sourceVal = (source as Record<string, unknown>)[key];
      const targetVal = (target as Record<string, unknown>)[key];
      result[key] = deepMerge(targetVal, sourceVal, options);
    }
    return result;
  }

  // For primitives, source wins
  return source;
}

/**
 * Merges two JSON objects.
 */
function execute(input: Input, options?: Options): Output {
  const opts = {
    second: options?.second ?? "{}",
    deep: options?.deep ?? true,
    arrayStrategy: options?.arrayStrategy ?? ("replace" as const),
    indent: options?.indent ?? 2,
  };

  let first: unknown;
  let second: unknown;

  try {
    first = JSON.parse(input.input);
  } catch (err) {
    throw createToolError({
      code: JSON_PARSE_ERROR,
      message: `Invalid first JSON: ${err instanceof Error ? err.message : "Parse error"}`,
    });
  }

  try {
    second = JSON.parse(opts.second);
  } catch (err) {
    throw createToolError({
      code: JSON_PARSE_ERROR,
      message: `Invalid second JSON: ${err instanceof Error ? err.message : "Parse error"}`,
    });
  }

  const merged = deepMerge(first, second, opts);
  const output = JSON.stringify(merged, null, opts.indent);

  return { output };
}

/**
 * JSON Merge tool.
 * Merges two JSON objects with configurable strategies.
 */
export const jsonMerge = defineTool({
  meta: {
    id: "json/merge",
    name: "JSON Merge",
    description:
      "Free online JSON merge tool — deep merge two JSON objects with configurable array strategies instantly in your browser. No data is stored. Supports replace, concat, and unique array merging.",
    category: "json",
    subgroup: "Core",
    tier: ToolTier.CLIENT,
    keywords: ["json", "merge", "combine", "deep", "shallow"],
    examples: [
      {
        title: "Deep Merge Objects",
        description:
          "Deep merge two configuration objects, combining nested properties",
        input:
          '{"database": {"host": "localhost", "port": 5432}, "logging": {"level": "info"}}',
        options: {
          second:
            '{"database": {"port": 3306, "name": "mydb"}, "cache": {"ttl": 300}}',
        },
        output:
          '{\n  "database": {\n    "host": "localhost",\n    "port": 3306,\n    "name": "mydb"\n  },\n  "logging": {\n    "level": "info"\n  },\n  "cache": {\n    "ttl": 300\n  }\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
