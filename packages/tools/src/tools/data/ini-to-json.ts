import { z } from "zod";
import ini from "ini";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { INI_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("INI string to convert to JSON"),
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
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Converts INI to JSON format.
 */
function execute(input: Input, options?: Options): Output {
  const indent = options?.indent ?? 2;

  try {
    const parsed = ini.parse(input.input);
    const output = JSON.stringify(parsed, null, indent);

    return { output };
  } catch (err) {
    throw createToolError({
      code: INI_PARSE_ERROR,
      message: `Invalid INI: ${err instanceof Error ? err.message : "Parse error"}`,
    });
  }
}

/**
 * INI to JSON tool.
 * Converts INI configuration to JSON format.
 */
export const iniToJson = defineTool({
  meta: {
    id: "data/ini-to-json",
    name: "INI to JSON",
    description:
      "Free online INI to JSON converter — convert INI configuration files to JSON format instantly in your browser. No data is stored. Parses sections, key-value pairs, and nested groups into structured JSON output.",
    category: "data",
    tier: ToolTier.CLIENT,
    keywords: [
      "ini",
      "json",
      "convert",
      "transform",
      "config",
      "configuration",
      "settings",
      "properties",
    ],
    examples: [
      {
        title: "Database section with host and port",
        description:
          "Convert an INI configuration section to nested JSON object",
        input: "[database]\nhost=localhost\nport=5432",
        output:
          '{\n  "database": {\n    "host": "localhost",\n    "port": "5432"\n  }\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
