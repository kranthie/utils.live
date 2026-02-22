import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { EXEC_FAILED } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("JavaScript escaped string to unescape"),
});

const outputSchema = z.object({
  output: z.string().describe("Unescaped text"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  try {
    let result = "";
    let i = 0;
    const str = input.input;

    while (i < str.length) {
      if (str[i] === "\\" && i + 1 < str.length) {
        const next = str[i + 1];
        switch (next) {
          case "\\":
            result += "\\";
            i += 2;
            break;
          case "'":
            result += "'";
            i += 2;
            break;
          case '"':
            result += '"';
            i += 2;
            break;
          case "`":
            result += "`";
            i += 2;
            break;
          case "n":
            result += "\n";
            i += 2;
            break;
          case "r":
            result += "\r";
            i += 2;
            break;
          case "t":
            result += "\t";
            i += 2;
            break;
          case "b":
            result += "\b";
            i += 2;
            break;
          case "f":
            result += "\f";
            i += 2;
            break;
          case "0":
            result += "\0";
            i += 2;
            break;
          case "x": {
            // \xHH
            const hex = str.substring(i + 2, i + 4);
            if (/^[0-9a-fA-F]{2}$/.test(hex)) {
              result += String.fromCharCode(parseInt(hex, 16));
              i += 4;
            } else {
              result += "\\x";
              i += 2;
            }
            break;
          }
          case "u": {
            if (str[i + 2] === "{") {
              // \u{XXXXXX}
              const end = str.indexOf("}", i + 3);
              if (end !== -1) {
                const hex = str.substring(i + 3, end);
                if (/^[0-9a-fA-F]+$/.test(hex)) {
                  result += String.fromCodePoint(parseInt(hex, 16));
                  i = end + 1;
                } else {
                  result += "\\u{";
                  i += 3;
                }
              } else {
                result += "\\u{";
                i += 3;
              }
            } else {
              // \uXXXX
              const hex = str.substring(i + 2, i + 6);
              if (/^[0-9a-fA-F]{4}$/.test(hex)) {
                result += String.fromCharCode(parseInt(hex, 16));
                i += 6;
              } else {
                result += "\\u";
                i += 2;
              }
            }
            break;
          }
          default:
            result += "\\" + next;
            i += 2;
        }
      } else {
        result += str[i];
        i++;
      }
    }
    return { output: result };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to unescape";
    throw createToolError({
      code: EXEC_FAILED,
      message: `JavaScript unescape failed: ${msg}`,
    });
  }
}

export const jsUnescape = defineTool({
  meta: {
    id: "encoding/js-unescape",
    name: "JavaScript Unescape",
    description:
      "Free online JavaScript string unescaper — convert JavaScript escape sequences back to readable text instantly in your browser. No data is stored. Handles \\n, \\t, \\uXXXX, \\u{XXXXXX}, \\xHH, and all standard JS escape sequences.",
    category: "encoding",
    subgroup: "Text Encoding",
    tier: ToolTier.CLIENT,
    keywords: ["javascript", "unescape", "string", "js", "decode"],
    examples: [
      {
        title: "Unescape String",
        description:
          "Convert JavaScript escape sequences back to readable text",
        input: "Hello\\nWorld\\t!",
        output: "Hello\nWorld\t!",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
