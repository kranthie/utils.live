import { z } from "zod";
import TOML from "@iarna/toml";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { TOML_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("TOML string to format"),
});

const outputSchema = z.object({
  output: z.string().describe("Formatted TOML string"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Formats a TOML string.
 */
function execute(input: Input): Output {
  try {
    const parsed = TOML.parse(input.input);
    const output = TOML.stringify(parsed);

    return { output };
  } catch (err) {
    throw createToolError({
      code: TOML_PARSE_ERROR,
      message: `Invalid TOML: ${err instanceof Error ? err.message : "Parse error"}`,
    });
  }
}

/**
 * TOML Formatter tool.
 * Formats TOML strings.
 */
export const tomlFormatter = defineTool({
  meta: {
    id: "toml/formatter",
    name: "TOML Formatter",
    description:
      "Free online TOML formatter — paste messy TOML and get clean, normalized output instantly in your browser. No data is stored. Expands inline tables, normalizes spacing, and validates syntax.",
    category: "toml",
    tier: ToolTier.CLIENT,
    keywords: [
      "toml",
      "format",
      "prettify",
      "beautify",
      "lint",
      "indent",
      "normalize",
      "config",
      "configuration",
    ],
    examples: [
      {
        title: "Normalize messy Cargo.toml",
        description:
          "Clean up a Cargo.toml with compact inline tables — the formatter expands them into proper sections",
        input:
          '[package]\nname="my-app"\nversion="0.1.0"\nedition="2021"\n\n[dependencies]\nserde={version="1.0",features=["derive"]}\ntokio={version="1",features=["full"]}',
        output:
          '[package]\nname = "my-app"\nversion = "0.1.0"\nedition = "2021"\n\n[dependencies.serde]\nversion = "1.0"\nfeatures = [ "derive" ]\n\n[dependencies.tokio]\nversion = "1"\nfeatures = [ "full" ]\n',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
