import { z } from "zod";
import yaml from "js-yaml";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { JSON_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("JSON string to convert to YAML"),
});

const outputSchema = z.object({
  output: z.string().describe("YAML string"),
});

const optionsSchema = z.object({
  indent: z
    .number()
    .int()
    .min(1)
    .max(8)
    .default(2)
    .describe("Indentation spaces"),
  flowLevel: z
    .number()
    .int()
    .min(-1)
    .max(10)
    .default(-1)
    .describe("Flow style level (-1 for block style)"),
  sortKeys: z.boolean().default(false).describe("Sort object keys"),
  lineWidth: z
    .number()
    .int()
    .min(40)
    .max(1000)
    .default(80)
    .describe("Max line width"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Converts JSON to YAML format.
 */
function execute(input: Input, options?: Options): Output {
  const indent = options?.indent ?? 2;
  const flowLevel = options?.flowLevel ?? -1;
  const sortKeys = options?.sortKeys ?? false;
  const lineWidth = options?.lineWidth ?? 80;

  try {
    const parsed: unknown = JSON.parse(input.input);
    const output = yaml.dump(parsed, {
      indent,
      flowLevel,
      sortKeys,
      lineWidth,
      noRefs: true,
    });

    return { output };
  } catch (err) {
    throw createToolError({
      code: JSON_PARSE_ERROR,
      message: `Invalid JSON: ${err instanceof Error ? err.message : "Parse error"}`,
    });
  }
}

/**
 * JSON to YAML tool.
 * Converts JSON to YAML format.
 */
export const jsonToYaml = defineTool({
  meta: {
    id: "json/to-yaml",
    name: "JSON to YAML",
    description:
      "Free online JSON to YAML converter — convert JSON to YAML format instantly in your browser. No data is stored. Configurable indentation, flow style level, key sorting, and line width.",
    category: "json",
    subgroup: "Core",
    tier: ToolTier.CLIENT,
    keywords: ["json", "yaml", "convert", "transform", "yml"],
    examples: [
      {
        title: "Config Object",
        description: "Convert a JSON configuration to YAML",
        input:
          '{"server":{"host":"localhost","port":3000},"database":{"url":"postgres://localhost/mydb","pool":5}}',
        output:
          "server:\n  host: localhost\n  port: 3000\ndatabase:\n  url: postgres://localhost/mydb\n  pool: 5\n",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
