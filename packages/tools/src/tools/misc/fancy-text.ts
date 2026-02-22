import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({ input: z.string().describe("Text to stylize") });
const optionsSchema = z.object({
  style: z
    .enum([
      "bold",
      "italic",
      "bold-italic",
      "script",
      "fraktur",
      "double-struck",
      "monospace",
      "circled",
      "squared",
      "fullwidth",
    ])
    .default("bold")
    .describe("Unicode text style"),
});
const outputSchema = z.object({
  output: z.string().describe("Styled Unicode text"),
});

const OFFSETS: Record<
  string,
  { upper: number; lower: number; digit?: number }
> = {
  bold: { upper: 0x1d400 - 65, lower: 0x1d41a - 97, digit: 0x1d7ce - 48 },
  italic: { upper: 0x1d434 - 65, lower: 0x1d44e - 97 },
  "bold-italic": { upper: 0x1d468 - 65, lower: 0x1d482 - 97 },
  script: { upper: 0x1d49c - 65, lower: 0x1d4b6 - 97 },
  fraktur: { upper: 0x1d504 - 65, lower: 0x1d51e - 97 },
  "double-struck": {
    upper: 0x1d538 - 65,
    lower: 0x1d552 - 97,
    digit: 0x1d7d8 - 48,
  },
  monospace: { upper: 0x1d670 - 65, lower: 0x1d68a - 97, digit: 0x1d7f6 - 48 },
};

const CIRCLED_UPPER = "ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏ";
const CIRCLED_LOWER = "ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ";
const CIRCLED_DIGIT = "⓪①②③④⑤⑥⑦⑧⑨";
const SQUARED_UPPER = "🅰🅱🅲🅳🅴🅵🅶🅷🅸🅹🅺🅻🅼🅽🅾🅿🆀🆁🆂🆃🆄🆅🆆🆇🆈🆉";

function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): z.infer<typeof outputSchema> {
  if (!input.input.trim()) throw new Error("Input cannot be empty");
  const style = options?.style ?? "bold";

  if (style === "fullwidth") {
    const result = [...input.input]
      .map((ch) => {
        const code = ch.charCodeAt(0);
        if (code >= 33 && code <= 126)
          return String.fromCharCode(code + 0xff00 - 0x20);
        if (code === 32) return "\u3000";
        return ch;
      })
      .join("");
    return { output: result };
  }

  if (style === "circled") {
    const result = [...input.input]
      .map((ch) => {
        const code = ch.charCodeAt(0);
        if (code >= 65 && code <= 90) return [...CIRCLED_UPPER][code - 65];
        if (code >= 97 && code <= 122) return [...CIRCLED_LOWER][code - 97];
        if (code >= 48 && code <= 57) return [...CIRCLED_DIGIT][code - 48];
        return ch;
      })
      .join("");
    return { output: result };
  }

  if (style === "squared") {
    const result = [...input.input]
      .map((ch) => {
        const code = ch.charCodeAt(0);
        if (code >= 65 && code <= 90) return [...SQUARED_UPPER][code - 65];
        if (code >= 97 && code <= 122) return [...SQUARED_UPPER][code - 97];
        return ch;
      })
      .join("");
    return { output: result };
  }

  const offset = OFFSETS[style];
  if (!offset) return { output: input.input };

  const result = [...input.input]
    .map((ch) => {
      const code = ch.charCodeAt(0);
      if (code >= 65 && code <= 90)
        return String.fromCodePoint(code + offset.upper);
      if (code >= 97 && code <= 122)
        return String.fromCodePoint(code + offset.lower);
      if (offset.digit && code >= 48 && code <= 57)
        return String.fromCodePoint(code + offset.digit);
      return ch;
    })
    .join("");

  return { output: result };
}

export const fancyText = defineTool({
  meta: {
    id: "misc/fancy-text",
    name: "Fancy Text",
    description:
      "Free online fancy text generator — convert plain text to Unicode styled characters instantly in your browser. No data is stored. Supports bold, italic, script, fraktur, double-struck, monospace, circled, squared, and fullwidth styles.",
    category: "misc",
    subgroup: "Fun Tools",
    tier: ToolTier.CLIENT,
    keywords: [
      "fancy",
      "text",
      "unicode",
      "bold",
      "italic",
      "style",
      "font",
      "script",
      "fraktur",
      "monospace",
      "circled",
    ],
    examples: [
      {
        title: "Bold Unicode text for social media",
        description:
          "Convert plain text to mathematical bold Unicode characters that work in bios and posts",
        input: "Hello World",
        output:
          "\uD835\uDC07\uD835\uDC1E\uD835\uDC25\uD835\uDC25\uD835\uDC28 \uD835\uDC16\uD835\uDC28\uD835\uDC2B\uD835\uDC25\uD835\uDC1D",
      },
      {
        title: "Circled letter style",
        description:
          "Convert uppercase text to circled Unicode letters for decorative headers",
        input: "HELLO",
        options: { style: "circled" },
        output: "\u24BD\u24BE\u24C1\u24C1\u24C4",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
