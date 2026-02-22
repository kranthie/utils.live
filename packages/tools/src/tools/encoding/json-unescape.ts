import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { EXEC_FAILED } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("JSON-escaped string to unescape"),
});

const outputSchema = z.object({
  output: z.string().describe("Unescaped text"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  try {
    // Wrap in quotes and parse as JSON string
    const result = JSON.parse(`"${input.input}"`) as Record<string, unknown>;
    if (typeof result !== "string") {
      throw new Error("Result is not a string");
    }
    return { output: result };
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Invalid JSON escaped string";
    throw createToolError({
      code: EXEC_FAILED,
      message: `JSON unescape failed: ${msg}`,
    });
  }
}

export const jsonUnescape = defineTool({
  meta: {
    id: "encoding/json-unescape",
    name: "JSON Unescape",
    description:
      'Free online JSON string unescaper — convert JSON escape sequences back to readable text instantly in your browser. No data is stored. Handles \\n, \\t, \\", \\\\, and Unicode escape sequences.',
    category: "encoding",
    subgroup: "Text Encoding",
    tier: ToolTier.CLIENT,
    keywords: ["json", "unescape", "string", "parse", "decode"],
    examples: [
      {
        title: "Unescape JSON String",
        description: "Convert JSON escape sequences back to readable text",
        input: 'Hello\\nWorld\\t\\"quoted\\"',
        output: 'Hello\nWorld\t"quoted"',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
