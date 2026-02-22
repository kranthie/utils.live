import { z } from "zod";
import ini from "ini";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { JSON_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("JSON string to convert to INI"),
});

const outputSchema = z.object({
  output: z.string().describe("INI string"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Converts JSON to INI format.
 */
function execute(input: Input): Output {
  try {
    const parsed: unknown = JSON.parse(input.input);

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      throw new Error("INI requires an object at the root level");
    }

    const output = ini.stringify(parsed);

    return { output };
  } catch (err) {
    throw createToolError({
      code: JSON_PARSE_ERROR,
      message: `${err instanceof Error ? err.message : "Conversion error"}`,
    });
  }
}

/**
 * JSON to INI tool.
 * Converts JSON to INI configuration format.
 */
export const jsonToIni = defineTool({
  meta: {
    id: "data/json-to-ini",
    name: "JSON to INI",
    description:
      "Free online JSON to INI converter — convert JSON objects to INI configuration format instantly in your browser. No data is stored. Maps nested JSON objects to INI sections with key-value pairs.",
    category: "data",
    tier: ToolTier.CLIENT,
    keywords: [
      "json",
      "ini",
      "convert",
      "transform",
      "config",
      "configuration",
      "settings",
    ],
    examples: [
      {
        title: "Database config object to INI section",
        description: "Convert a JSON object with sections to INI format",
        input: '{"database": {"host": "localhost", "port": "5432"}}',
        output: "[database]\nhost=localhost\nport=5432\n",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
