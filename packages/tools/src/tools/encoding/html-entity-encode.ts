import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { EXEC_FAILED } from "../../core/error-codes";

const NAMED_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "\u00A0": "&nbsp;",
  "\u00A9": "&copy;",
  "\u00AE": "&reg;",
  "\u2122": "&trade;",
  "\u2013": "&ndash;",
  "\u2014": "&mdash;",
  "\u2018": "&lsquo;",
  "\u2019": "&rsquo;",
  "\u201C": "&ldquo;",
  "\u201D": "&rdquo;",
  "\u2026": "&hellip;",
  "\u00B0": "&deg;",
  "\u00B1": "&plusmn;",
  "\u00D7": "&times;",
  "\u00F7": "&divide;",
  "\u2264": "&le;",
  "\u2265": "&ge;",
  "\u2260": "&ne;",
};

const inputSchema = z.object({
  input: z.string().describe("Text to encode to HTML entities"),
});

const outputSchema = z.object({
  output: z.string().describe("HTML entity encoded string"),
});

const optionsSchema = z.object({
  mode: z
    .enum(["named", "numeric", "hex"])
    .default("named")
    .describe("Entity format: named (&amp;), numeric (&#38;), or hex (&#x26;)"),
  encodeAll: z
    .boolean()
    .default(false)
    .describe(
      "Encode all characters including ASCII (default: only special chars)"
    ),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

function execute(input: Input, options?: Options): Output {
  const mode = options?.mode ?? "named";
  const encodeAll = options?.encodeAll ?? false;

  try {
    let result = "";
    for (let i = 0; i < input.input.length; i++) {
      const ch = input.input[i]!;
      const codePoint = input.input.codePointAt(i)!;

      if (codePoint > 0xffff) {
        // Supplementary plane character
        if (mode === "hex") {
          result += `&#x${codePoint.toString(16).toUpperCase()};`;
        } else {
          result += `&#${codePoint};`;
        }
        i++; // Skip surrogate pair
        continue;
      }

      const namedEntity = NAMED_ENTITIES[ch];
      if (mode === "named" && namedEntity) {
        result += namedEntity;
      } else if (
        encodeAll ||
        codePoint > 127 ||
        ch === "&" ||
        ch === "<" ||
        ch === ">" ||
        ch === '"' ||
        ch === "'"
      ) {
        if (mode === "hex") {
          result += `&#x${codePoint.toString(16).toUpperCase()};`;
        } else {
          result += `&#${codePoint};`;
        }
      } else {
        result += ch;
      }
    }
    return { output: result };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to encode";
    throw createToolError({
      code: EXEC_FAILED,
      message: `HTML entity encoding failed: ${msg}`,
    });
  }
}

export const htmlEntityEncode = defineTool({
  meta: {
    id: "encoding/html-entity-encode",
    name: "HTML Entity Encode",
    description:
      "Free online HTML entity encoder — encode text to HTML entities instantly in your browser. No data is stored. Supports named (&amp;), numeric (&#38;), and hex (&#x26;) formats with optional full-character encoding for XSS prevention.",
    category: "encoding",
    subgroup: "Text Encoding",
    tier: ToolTier.CLIENT,
    keywords: ["html", "entity", "encode", "escape", "amp", "lt", "gt"],
    examples: [
      {
        title: "Script Tag",
        description: "Escape HTML special characters to prevent XSS",
        input: '<script>alert("xss")</script>',
        output: "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;",
      },
      {
        title: "Ampersands & Quotes",
        description: "Encode common HTML-unsafe characters",
        input: 'Tom & Jerry say "hello"',
        output: "Tom &amp; Jerry say &quot;hello&quot;",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
