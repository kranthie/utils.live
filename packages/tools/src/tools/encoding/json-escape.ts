import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { EXEC_FAILED } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("Text to escape for JSON strings"),
});

const outputSchema = z.object({
  output: z.string().describe("JSON-escaped string"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  try {
    // JSON.stringify adds quotes around the string and escapes internal content
    const jsonStr = JSON.stringify(input.input);
    // Remove the surrounding quotes
    return { output: jsonStr.slice(1, -1) };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to escape";
    throw createToolError({
      code: EXEC_FAILED,
      message: `JSON escape failed: ${msg}`,
    });
  }
}

export const jsonEscape = defineTool({
  meta: {
    id: "encoding/json-escape",
    name: "JSON Escape",
    description:
      "Free online JSON string escaper — escape text for safe embedding in JSON strings instantly in your browser. No data is stored. Properly escapes quotes, backslashes, newlines, tabs, and control characters per the JSON specification.",
    category: "encoding",
    subgroup: "Text Encoding",
    tier: ToolTier.CLIENT,
    keywords: ["json", "escape", "string", "stringify"],
    examples: [
      {
        title: "Escape for JSON",
        description:
          "Escape special characters for safe embedding in a JSON string",
        input: 'Line 1\nLine 2\t"quoted"',
        output: 'Line 1\\nLine 2\\t\\"quoted\\"',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
