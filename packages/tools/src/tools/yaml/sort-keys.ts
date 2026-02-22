import { z } from "zod";
import yaml from "js-yaml";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { YAML_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("YAML string to sort"),
});

const outputSchema = z.object({
  output: z.string().describe("YAML string with sorted keys"),
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
    .min(1)
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
 * Sorts object keys in YAML.
 */
function execute(input: Input, options?: Options): Output {
  const order = options?.order ?? "asc";
  const deep = options?.deep ?? true;
  const indent = options?.indent ?? 2;

  try {
    const parsed = yaml.load(input.input);
    const sorted = sortObjectKeys(parsed, order, deep);
    const output = yaml.dump(sorted, {
      indent,
      noRefs: true,
    });

    return { output };
  } catch (err) {
    throw createToolError({
      code: YAML_PARSE_ERROR,
      message: `Invalid YAML: ${err instanceof Error ? err.message : "Parse error"}`,
    });
  }
}

/**
 * YAML Sort Keys tool.
 * Sorts object keys alphabetically in YAML.
 */
export const yamlSortKeys = defineTool({
  meta: {
    id: "yaml/sort-keys",
    name: "YAML Sort Keys",
    description:
      "Free online YAML key sorter — sort object keys alphabetically in YAML documents instantly in your browser. No data is stored. Supports ascending/descending order, deep recursive sorting, and configurable indentation.",
    category: "yaml",
    tier: ToolTier.CLIENT,
    keywords: [
      "yaml",
      "sort",
      "keys",
      "alphabetical",
      "order",
      "normalize",
      "deterministic",
      "config",
    ],
    examples: [
      {
        title: "Alphabetize nested config keys",
        description:
          "Sort all keys recursively in a multi-section config for consistent ordering",
        input:
          "server:\n  port: 3000\n  host: localhost\ndatabase:\n  port: 5432\n  host: db.example.com\n  name: myapp\napp:\n  name: MyApp\n  version: 1.0.0",
        output:
          "app:\n  name: MyApp\n  version: 1.0.0\ndatabase:\n  host: db.example.com\n  name: myapp\n  port: 5432\nserver:\n  host: localhost\n  port: 3000\n",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
