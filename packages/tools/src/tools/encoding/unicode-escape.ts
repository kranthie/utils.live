import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { EXEC_FAILED } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("Text to escape to Unicode notation"),
});

const outputSchema = z.object({
  output: z.string().describe("Unicode escaped string using \\uXXXX notation"),
});

const optionsSchema = z.object({
  escapeAll: z
    .boolean()
    .default(false)
    .describe(
      "Escape all characters including ASCII (default: only non-ASCII)"
    ),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

function execute(input: Input, options?: Options): Output {
  const escapeAll = options?.escapeAll ?? false;

  try {
    let result = "";
    for (let i = 0; i < input.input.length; i++) {
      const codePoint = input.input.codePointAt(i)!;
      const ch = input.input[i];

      if (!escapeAll && codePoint >= 0x20 && codePoint <= 0x7e) {
        // Printable ASCII, keep as-is
        result += ch;
      } else if (codePoint > 0xffff) {
        // Supplementary plane: use surrogate pair or \u{XXXXXX}
        result += `\\u{${codePoint.toString(16).toUpperCase()}}`;
        // Skip the second surrogate
        i++;
      } else {
        result += `\\u${codePoint.toString(16).toUpperCase().padStart(4, "0")}`;
      }
    }
    return { output: result };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to escape";
    throw createToolError({
      code: EXEC_FAILED,
      message: `Unicode escape failed: ${msg}`,
    });
  }
}

export const unicodeEscape = defineTool({
  meta: {
    id: "encoding/unicode-escape",
    name: "Unicode Escape",
    description:
      "Free online Unicode escaper — convert text to \\uXXXX Unicode escape notation instantly in your browser. No data is stored. Supports BMP (\\uXXXX) and supplementary plane (\\u{XXXXXX}) formats with optional full-character escaping.",
    category: "encoding",
    subgroup: "Text Encoding",
    tier: ToolTier.CLIENT,
    keywords: ["unicode", "escape", "\\u", "codepoint", "notation"],
    examples: [
      {
        title: "Escape Non-ASCII",
        description: "Convert non-ASCII characters to \\uXXXX notation",
        input: "caf\u00E9 na\u00EFve",
        output: "caf\\u00E9 na\\u00EFve",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
