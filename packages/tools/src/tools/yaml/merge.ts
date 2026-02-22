import { z } from "zod";
import yaml from "js-yaml";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { YAML_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input1: z.string().describe("Base YAML document"),
  input2: z.string().describe("YAML document to merge"),
});

const outputSchema = z.object({
  output: z.string().describe("Merged YAML document"),
});

const optionsSchema = z.object({
  strategy: z
    .enum(["shallow", "deep"])
    .default("deep")
    .describe("Merge strategy: shallow (overwrite) or deep (recursive)"),
  arrayMerge: z
    .enum(["replace", "concat", "unique"])
    .default("replace")
    .describe("Array merge strategy"),
  indent: z
    .number()
    .int()
    .min(1)
    .max(8)
    .default(2)
    .describe("Output indentation"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

function deepMerge(
  target: unknown,
  source: unknown,
  arrayMerge: "replace" | "concat" | "unique"
): unknown {
  if (source === undefined) {
    return target;
  }

  if (target === null || source === null) {
    return source;
  }

  if (Array.isArray(target) && Array.isArray(source)) {
    const targetArr = target as unknown[];
    const sourceArr = source as unknown[];
    switch (arrayMerge) {
      case "concat":
        return [...targetArr, ...sourceArr];
      case "unique": {
        const seen = new Set([
          ...targetArr.map((v) => JSON.stringify(v)),
          ...sourceArr.map((v) => JSON.stringify(v)),
        ]);
        return [...seen].map((s) => JSON.parse(s) as unknown);
      }
      case "replace":
      default:
        return source;
    }
  }

  if (
    typeof target === "object" &&
    typeof source === "object" &&
    !Array.isArray(target) &&
    !Array.isArray(source)
  ) {
    const result = { ...(target as Record<string, unknown>) };
    for (const [key, value] of Object.entries(
      source as Record<string, unknown>
    )) {
      result[key] = deepMerge(result[key], value, arrayMerge);
    }
    return result;
  }

  return source;
}

/**
 * Merges two YAML documents.
 */
function execute(input: Input, options?: Options): Output {
  const strategy = options?.strategy ?? "deep";
  const arrayMerge = options?.arrayMerge ?? "replace";
  const indent = options?.indent ?? 2;

  let parsed1: unknown;
  let parsed2: unknown;

  try {
    parsed1 = yaml.load(input.input1);
  } catch (err) {
    throw createToolError({
      code: YAML_PARSE_ERROR,
      message: `Invalid YAML in first input: ${err instanceof Error ? err.message : "Parse error"}`,
    });
  }

  try {
    parsed2 = yaml.load(input.input2);
  } catch (err) {
    throw createToolError({
      code: YAML_PARSE_ERROR,
      message: `Invalid YAML in second input: ${err instanceof Error ? err.message : "Parse error"}`,
    });
  }

  let merged: unknown;
  if (strategy === "shallow") {
    if (
      typeof parsed1 === "object" &&
      parsed1 !== null &&
      typeof parsed2 === "object" &&
      parsed2 !== null
    ) {
      merged = { ...parsed1, ...parsed2 };
    } else {
      merged = parsed2;
    }
  } else {
    merged = deepMerge(parsed1, parsed2, arrayMerge);
  }

  const output = yaml.dump(merged, {
    indent,
    noRefs: true,
  });

  return { output };
}

/**
 * YAML Merge tool.
 * Merges two YAML documents with configurable strategies.
 */
export const yamlMerge = defineTool({
  meta: {
    id: "yaml/merge",
    name: "YAML Merge",
    description:
      "Free online YAML merge tool — combine two YAML documents instantly in your browser. No data is stored. Supports deep and shallow merge strategies with configurable array handling (replace, concat, unique).",
    category: "yaml",
    tier: ToolTier.CLIENT,
    keywords: [
      "yaml",
      "merge",
      "combine",
      "join",
      "override",
      "config",
      "deep-merge",
      "overlay",
    ],
    examples: [
      {
        title: "Deep merge config overrides",
        description:
          "Merge base server config with environment-specific overrides — nested keys are merged recursively",
        input: {
          input1:
            "server:\n  host: localhost\n  port: 3000\ndatabase:\n  host: localhost\n  port: 5432",
          input2:
            "server:\n  port: 8080\n  ssl: true\nlogging:\n  level: debug",
        },
        output:
          "server:\n  host: localhost\n  port: 8080\n  ssl: true\ndatabase:\n  host: localhost\n  port: 5432\nlogging:\n  level: debug\n",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
