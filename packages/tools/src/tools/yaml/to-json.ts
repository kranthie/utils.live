import { z } from "zod";
import yaml from "js-yaml";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { YAML_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("YAML string to convert to JSON"),
});

const outputSchema = z.object({
  output: z.string().describe("JSON string"),
});

const optionsSchema = z.object({
  indent: z
    .number()
    .int()
    .min(0)
    .max(8)
    .default(2)
    .describe("JSON indentation spaces"),
  sortKeys: z.boolean().default(false).describe("Sort object keys"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

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
 * Converts YAML to JSON format.
 */
function execute(input: Input, options?: Options): Output {
  const indent = options?.indent ?? 2;
  const shouldSortKeys = options?.sortKeys ?? false;

  try {
    const parsed = yaml.load(input.input);
    const toStringify = shouldSortKeys ? sortObjectKeys(parsed) : parsed;
    const output = JSON.stringify(toStringify, null, indent);

    return { output };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid YAML format";
    throw createToolError({
      code: YAML_PARSE_ERROR,
      message: `Invalid YAML: ${message}`,
    });
  }
}

/**
 * YAML to JSON tool.
 * Converts YAML to JSON format.
 */
export const yamlToJson = defineTool({
  meta: {
    id: "yaml/to-json",
    name: "YAML to JSON",
    description:
      "Free online YAML to JSON converter — paste YAML and get JSON output instantly in your browser. No data is stored. Handles nested objects, arrays, anchors, and all YAML data types with configurable indentation.",
    category: "yaml",
    tier: ToolTier.CLIENT,
    keywords: [
      "yaml",
      "json",
      "convert",
      "transform",
      "config",
      "docker-compose",
      "kubernetes",
      "parser",
    ],
    examples: [
      {
        title: "Docker Compose",
        description: "Convert a YAML Docker Compose snippet to JSON",
        input:
          "version: '3'\nservices:\n  web:\n    image: nginx:latest\n    ports:\n      - '80:80'",
        output:
          '{\n  "version": "3",\n  "services": {\n    "web": {\n      "image": "nginx:latest",\n      "ports": [\n        "80:80"\n      ]\n    }\n  }\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
