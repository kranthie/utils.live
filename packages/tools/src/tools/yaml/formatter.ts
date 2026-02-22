import { z } from "zod";
import yaml from "js-yaml";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { YAML_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("YAML string to format"),
});

const outputSchema = z.object({
  output: z.string().describe("Formatted YAML string"),
});

const optionsSchema = z.object({
  indent: z
    .number()
    .int()
    .min(1)
    .max(8)
    .default(2)
    .describe("Indentation spaces"),
  lineWidth: z
    .number()
    .int()
    .min(40)
    .max(1000)
    .default(80)
    .describe("Max line width"),
  sortKeys: z.boolean().default(false).describe("Sort object keys"),
  flowLevel: z
    .number()
    .int()
    .min(-1)
    .max(10)
    .default(-1)
    .describe("Flow style level (-1 for block style)"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Formats a YAML string with configurable options.
 */
function execute(input: Input, options?: Options): Output {
  const indent = options?.indent ?? 2;
  const lineWidth = options?.lineWidth ?? 80;
  const sortKeys = options?.sortKeys ?? false;
  const flowLevel = options?.flowLevel ?? -1;

  try {
    const parsed = yaml.load(input.input);
    const output = yaml.dump(parsed, {
      indent,
      lineWidth,
      sortKeys,
      flowLevel,
      noRefs: true,
    });

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
 * YAML Formatter tool.
 * Formats YAML strings with configurable indentation.
 */
export const yamlFormatter = defineTool({
  meta: {
    id: "yaml/formatter",
    name: "YAML Formatter",
    description:
      "Free online YAML formatter — prettify and normalize YAML files instantly in your browser. No data is stored. Configurable indentation, key sorting, line width, and flow-style control.",
    category: "yaml",
    tier: ToolTier.CLIENT,
    keywords: [
      "yaml",
      "format",
      "prettify",
      "beautify",
      "indent",
      "lint",
      "normalize",
      "config",
      "kubernetes",
      "docker-compose",
    ],
    examples: [
      {
        title: "Expand inline flow-style to block",
        description:
          "Convert compact inline YAML objects to properly indented block style",
        input:
          "server:\n  host: localhost\n  port: 3000\ndatabase: {url: 'postgres://localhost/db', pool: 5}",
        output:
          "server:\n  host: localhost\n  port: 3000\ndatabase:\n  url: postgres://localhost/db\n  pool: 5\n",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
