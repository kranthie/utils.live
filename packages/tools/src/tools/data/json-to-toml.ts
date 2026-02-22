import { z } from "zod";
import TOML from "@iarna/toml";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { JSON_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("JSON string to convert to TOML"),
});

const outputSchema = z.object({
  output: z.string().describe("TOML string"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Converts JSON to TOML format.
 */
function execute(input: Input): Output {
  try {
    const parsed: unknown = JSON.parse(input.input);

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      throw new Error("TOML requires an object at the root level");
    }

    const output = TOML.stringify(parsed as TOML.JsonMap);

    return { output };
  } catch (err) {
    throw createToolError({
      code: JSON_PARSE_ERROR,
      message: `${err instanceof Error ? err.message : "Conversion error"}`,
    });
  }
}

/**
 * JSON to TOML tool.
 * Converts JSON to TOML format.
 */
export const jsonToToml = defineTool({
  meta: {
    id: "data/json-to-toml",
    name: "JSON to TOML",
    description:
      "Free online JSON to TOML converter — convert JSON objects to TOML configuration format instantly in your browser. No data is stored. Maps nested JSON objects to TOML tables, arrays, and inline tables.",
    category: "data",
    tier: ToolTier.CLIENT,
    keywords: [
      "json",
      "toml",
      "convert",
      "transform",
      "config",
      "cargo",
      "pyproject",
      "configuration",
    ],
    examples: [
      {
        title: "Server config object to TOML table",
        description: "Convert a JSON object to TOML configuration format",
        input: '{"server": {"host": "localhost", "port": 8080}}',
        output: '[server]\nhost = "localhost"\nport = 8_080\n',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
