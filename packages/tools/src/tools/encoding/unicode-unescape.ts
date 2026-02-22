import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { EXEC_FAILED } from "../../core/error-codes";

const inputSchema = z.object({
  input: z
    .string()
    .describe("Unicode escaped string (\\uXXXX or \\u{XXXXXX}) to unescape"),
});

const outputSchema = z.object({
  output: z.string().describe("Unescaped text"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  try {
    const result = input.input
      // Handle \u{XXXXXX} (ES6 style for supplementary planes)
      .replace(/\\u\{([0-9a-fA-F]+)\}/g, (_match: string, hex: string) => {
        const codePoint = parseInt(hex, 16);
        return String.fromCodePoint(codePoint);
      })
      // Handle \uXXXX (BMP)
      .replace(/\\u([0-9a-fA-F]{4})/g, (_match: string, hex: string) => {
        return String.fromCharCode(parseInt(hex, 16));
      });

    return { output: result };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to unescape";
    throw createToolError({
      code: EXEC_FAILED,
      message: `Unicode unescape failed: ${msg}`,
    });
  }
}

export const unicodeUnescape = defineTool({
  meta: {
    id: "encoding/unicode-unescape",
    name: "Unicode Unescape",
    description:
      "Free online Unicode unescaper — decode \\uXXXX and \\u{XXXXXX} Unicode escape sequences back to readable text instantly in your browser. No data is stored. Handles both BMP and supplementary plane characters.",
    category: "encoding",
    subgroup: "Text Encoding",
    tier: ToolTier.CLIENT,
    keywords: ["unicode", "unescape", "\\u", "codepoint", "decode"],
    examples: [
      {
        title: "Unescape Unicode",
        description: "Convert Unicode escape sequences to readable characters",
        input: "\\u0048\\u0065\\u006C\\u006C\\u006F",
        output: "Hello",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
