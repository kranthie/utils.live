import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to encode as HTML entities"),
});

const outputSchema = z.object({
  output: z.string().describe("HTML entity encoded text"),
});

const optionsSchema = z.object({
  mode: z
    .enum(["named", "numeric", "hex"])
    .default("named")
    .describe("Entity encoding mode"),
  encodeAll: z
    .boolean()
    .default(false)
    .describe("Encode all characters, not just special ones"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

const NAMED_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "\u00a0": "&nbsp;",
  "\u00a9": "&copy;",
  "\u00ae": "&reg;",
  "\u2122": "&trade;",
  "\u2013": "&ndash;",
  "\u2014": "&mdash;",
  "\u2018": "&lsquo;",
  "\u2019": "&rsquo;",
  "\u201c": "&ldquo;",
  "\u201d": "&rdquo;",
  "\u2026": "&hellip;",
  "\u00b0": "&deg;",
  "\u00b1": "&plusmn;",
  "\u00d7": "&times;",
  "\u00f7": "&divide;",
};

const SPECIAL_CHARS = new Set(Object.keys(NAMED_ENTITIES));

function execute(input: Input, options?: Options): Output {
  const raw = input.input;
  if (!raw.trim()) {
    throw new Error("Input cannot be empty");
  }

  const mode = options?.mode ?? "named";
  const encodeAll = options?.encodeAll ?? false;

  let result = "";
  for (let i = 0; i < raw.length; i++) {
    const char = raw[i];
    const code = raw.charCodeAt(i);

    if (encodeAll && code > 127) {
      if (mode === "hex") {
        result += `&#x${code.toString(16)};`;
      } else if (mode === "numeric") {
        result += `&#${code};`;
      } else {
        result += (char && NAMED_ENTITIES[char]) ?? `&#${code};`;
      }
    } else if (char && SPECIAL_CHARS.has(char)) {
      if (mode === "named") {
        result += NAMED_ENTITIES[char] ?? char;
      } else if (mode === "numeric") {
        result += `&#${code};`;
      } else {
        result += `&#x${code.toString(16)};`;
      }
    } else if (
      encodeAll &&
      code > 31 &&
      code < 127 &&
      char !== " " &&
      char &&
      !/[a-zA-Z0-9]/.test(char)
    ) {
      if (mode === "hex") {
        result += `&#x${code.toString(16)};`;
      } else if (mode === "numeric") {
        result += `&#${code};`;
      } else {
        result += char;
      }
    } else {
      result += char ?? "";
    }
  }

  return { output: result };
}

export const htmlEntityEncoder = defineTool({
  meta: {
    id: "html/entity-encoder",
    name: "HTML Entity Encoder",
    description:
      "Free online HTML entity encoder — escape special characters as HTML entities instantly in your browser. No data is stored. Supports named (&amp;amp;), decimal (&#38;#38;), and hexadecimal (&#38;#x26;) encoding modes with optional full-text encoding.",
    category: "html",
    tier: ToolTier.CLIENT,
    keywords: [
      "html",
      "entity",
      "encode",
      "escape",
      "special characters",
      "XSS",
      "sanitize",
      "named entity",
      "numeric entity",
      "hex entity",
    ],
    examples: [
      {
        title: "Escape HTML for safe display",
        description:
          "Encode angle brackets, ampersands, and quotes to prevent XSS and render code snippets safely",
        input: '<script>alert("XSS & injection")</script>',
        output:
          "&lt;script&gt;alert(&quot;XSS &amp; injection&quot;)&lt;/script&gt;",
      },
    ],
    ui: {
      outputRenderer: "code",
    },
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
