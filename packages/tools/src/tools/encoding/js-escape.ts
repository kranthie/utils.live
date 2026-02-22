import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { EXEC_FAILED } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("Text to escape for JavaScript strings"),
});

const outputSchema = z.object({
  output: z.string().describe("JavaScript-escaped string"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  try {
    let result = "";
    for (let i = 0; i < input.input.length; i++) {
      const ch = input.input[i];
      const code = input.input.charCodeAt(i);

      switch (ch) {
        case "\\":
          result += "\\\\";
          break;
        case "'":
          result += "\\'";
          break;
        case '"':
          result += '\\"';
          break;
        case "`":
          result += "\\`";
          break;
        case "\n":
          result += "\\n";
          break;
        case "\r":
          result += "\\r";
          break;
        case "\t":
          result += "\\t";
          break;
        case "\b":
          result += "\\b";
          break;
        case "\f":
          result += "\\f";
          break;
        case "\0":
          result += "\\0";
          break;
        default:
          if (code < 0x20 || code === 0x7f) {
            // Control characters
            result += "\\x" + code.toString(16).padStart(2, "0");
          } else if (code >= 0x80 && code <= 0xffff) {
            result += "\\u" + code.toString(16).padStart(4, "0");
          } else if (code > 0xffff) {
            const codePoint = input.input.codePointAt(i)!;
            result += "\\u{" + codePoint.toString(16) + "}";
            i++; // Skip surrogate pair
          } else {
            result += ch;
          }
      }
    }
    return { output: result };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to escape";
    throw createToolError({
      code: EXEC_FAILED,
      message: `JavaScript escape failed: ${msg}`,
    });
  }
}

export const jsEscape = defineTool({
  meta: {
    id: "encoding/js-escape",
    name: "JavaScript Escape",
    description:
      "Free online JavaScript string escaper — escape text for safe use in JavaScript string literals instantly in your browser. No data is stored. Handles quotes, backslashes, newlines, tabs, control characters, and Unicode.",
    category: "encoding",
    subgroup: "Text Encoding",
    tier: ToolTier.CLIENT,
    keywords: ["javascript", "escape", "string", "js", "quotes"],
    examples: [
      {
        title: "Escape Quotes",
        description:
          "Escape special characters for use in a JavaScript string literal",
        input: 'He said "hello"\nNew line',
        output: 'He said \\"hello\\"\\nNew line',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
