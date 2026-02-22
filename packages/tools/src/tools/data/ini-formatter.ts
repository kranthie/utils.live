import { z } from "zod";
import ini from "ini";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { INI_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("INI string to format"),
});

const outputSchema = z.object({
  output: z.string().describe("Formatted INI string"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Formats an INI string.
 */
function execute(input: Input): Output {
  try {
    const parsed = ini.parse(input.input);
    const output = ini.stringify(parsed);

    return { output };
  } catch (err) {
    throw createToolError({
      code: INI_PARSE_ERROR,
      message: `Invalid INI: ${err instanceof Error ? err.message : "Parse error"}`,
    });
  }
}

/**
 * INI Formatter tool.
 * Formats INI configuration files.
 */
export const iniFormatter = defineTool({
  meta: {
    id: "data/ini-formatter",
    name: "INI Formatter",
    description:
      "Free online INI formatter — format and prettify INI configuration files instantly in your browser. No data is stored. Normalizes spacing between sections, aligns key-value pairs, and handles nested section groups.",
    category: "data",
    tier: ToolTier.CLIENT,
    keywords: [
      "ini",
      "format",
      "config",
      "configuration",
      "prettify",
      "settings",
      "properties",
    ],
    examples: [
      {
        title: "PostgreSQL and app config sections",
        description: "Format an INI configuration file with multiple sections",
        input: "[database]\nhost=localhost\nport=5432\n[app]\ndebug=true",
        output: "[database]\nhost=localhost\nport=5432\n\n[app]\ndebug=true\n",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
