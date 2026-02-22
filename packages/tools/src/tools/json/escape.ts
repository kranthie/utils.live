import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("String to escape for JSON"),
});

const outputSchema = z.object({
  output: z.string().describe("Escaped string (without outer quotes)"),
  withQuotes: z.string().describe("Escaped string with surrounding quotes"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Escapes a string for use in JSON.
 */
function execute(input: Input): Output {
  // Use JSON.stringify to properly escape, then remove outer quotes
  const escaped = JSON.stringify(input.input);
  const output = escaped.slice(1, -1);

  return {
    output,
    withQuotes: escaped,
  };
}

/**
 * JSON Escape tool.
 * Escapes special characters in strings for JSON.
 */
export const jsonEscape = defineTool({
  meta: {
    id: "json/escape",
    name: "JSON Escape",
    description:
      "Free online JSON escape tool — escape special characters in strings for JSON instantly in your browser. No data is stored. Handles quotes, newlines, tabs, backslashes, and Unicode characters.",
    category: "json",
    subgroup: "Core",
    tier: ToolTier.CLIENT,
    keywords: ["json", "escape", "string", "encode", "special characters"],
    examples: [
      {
        title: "Special Characters",
        description:
          "Escape quotes, newlines, and tabs for use inside a JSON string",
        input: 'He said "hello"\nNew line\tTab',
        output: 'He said \\"hello\\"\\nNew line\\tTab',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
