import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { JSON_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("Escaped JSON string to unescape"),
});

const outputSchema = z.object({
  output: z.string().describe("Unescaped string"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Unescapes a JSON-escaped string.
 */
function execute(input: Input): Output {
  try {
    // If input is already quoted, parse directly
    if (
      (input.input.startsWith('"') && input.input.endsWith('"')) ||
      (input.input.startsWith("'") && input.input.endsWith("'"))
    ) {
      const parsed: unknown = JSON.parse(input.input.replace(/^'|'$/g, '"'));
      const output = String(parsed);
      return { output };
    }

    // Otherwise wrap in quotes and parse
    const parsed: unknown = JSON.parse(`"${input.input}"`);
    const output = String(parsed);
    return { output };
  } catch (err) {
    throw createToolError({
      code: JSON_PARSE_ERROR,
      message: `Invalid escaped string: ${err instanceof Error ? err.message : "Parse error"}`,
    });
  }
}

/**
 * JSON Unescape tool.
 * Unescapes special characters in JSON strings.
 */
export const jsonUnescape = defineTool({
  meta: {
    id: "json/unescape",
    name: "JSON Unescape",
    description:
      'Free online JSON unescape tool — convert escaped characters back to their literal form instantly in your browser. No data is stored. Handles \\n, \\t, \\" and other JSON escape sequences.',
    category: "json",
    subgroup: "Core",
    tier: ToolTier.CLIENT,
    keywords: ["json", "unescape", "string", "decode", "special characters"],
    examples: [
      {
        title: "Unescape String",
        description: "Convert escaped characters back to their literal form",
        input: 'He said \\"hello\\"\\nNew line\\tTab',
        output: 'He said "hello"\nNew line\tTab',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
