import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { EXEC_FAILED } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("Text to fully URL-encode (all characters)"),
});

const outputSchema = z.object({
  output: z.string().describe("Fully URL-encoded string"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  try {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(input.input);
    let result = "";
    for (const byte of bytes) {
      result += "%" + byte.toString(16).toUpperCase().padStart(2, "0");
    }
    return { output: result };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to encode";
    throw createToolError({
      code: EXEC_FAILED,
      message: `Full URL encoding failed: ${msg}`,
    });
  }
}

export const urlEncodeFull = defineTool({
  meta: {
    id: "encoding/url-encode-full",
    name: "URL Encode (Full)",
    description:
      "Free online full URL encoder — percent-encode every character including safe ASCII characters instantly in your browser. No data is stored. Encodes all bytes to %XX format, useful for obfuscation or strict encoding requirements.",
    category: "encoding",
    subgroup: "URL Encoding",
    tier: ToolTier.CLIENT,
    keywords: ["url", "encode", "percent", "full", "all-characters"],
    examples: [
      {
        title: "Encode All Characters",
        description: "Percent-encode every character including safe ones",
        input: "Hello",
        output: "%48%65%6C%6C%6F",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
