import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { EXEC_FAILED } from "../../core/error-codes";

const NAMED_ENTITY_MAP: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": "\u00A0",
  "&copy;": "\u00A9",
  "&reg;": "\u00AE",
  "&trade;": "\u2122",
  "&ndash;": "\u2013",
  "&mdash;": "\u2014",
  "&lsquo;": "\u2018",
  "&rsquo;": "\u2019",
  "&ldquo;": "\u201C",
  "&rdquo;": "\u201D",
  "&hellip;": "\u2026",
  "&deg;": "\u00B0",
  "&plusmn;": "\u00B1",
  "&times;": "\u00D7",
  "&divide;": "\u00F7",
  "&le;": "\u2264",
  "&ge;": "\u2265",
  "&ne;": "\u2260",
  "&euro;": "\u20AC",
  "&pound;": "\u00A3",
  "&yen;": "\u00A5",
  "&cent;": "\u00A2",
  "&laquo;": "\u00AB",
  "&raquo;": "\u00BB",
  "&iquest;": "\u00BF",
  "&iexcl;": "\u00A1",
  "&sect;": "\u00A7",
  "&para;": "\u00B6",
  "&micro;": "\u00B5",
  "&frac12;": "\u00BD",
  "&frac14;": "\u00BC",
  "&frac34;": "\u00BE",
};

const inputSchema = z.object({
  input: z.string().describe("HTML entity encoded string to decode"),
});

const outputSchema = z.object({
  output: z.string().describe("Decoded text"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  try {
    let result = input.input;

    // Decode hex entities: &#xHEX;
    result = result.replace(
      /&#x([0-9a-fA-F]+);/g,
      (_match: string, hex: string) => {
        return String.fromCodePoint(parseInt(hex, 16));
      }
    );

    // Decode numeric entities: &#DEC;
    result = result.replace(/&#(\d+);/g, (_match: string, dec: string) => {
      return String.fromCodePoint(parseInt(dec, 10));
    });

    // Decode named entities
    for (const [entity, char] of Object.entries(NAMED_ENTITY_MAP)) {
      // Use a regex with global flag for case-insensitive matching
      const escaped = entity.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      result = result.replace(new RegExp(escaped, "gi"), char);
    }

    return { output: result };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to decode";
    throw createToolError({
      code: EXEC_FAILED,
      message: `HTML entity decoding failed: ${msg}`,
    });
  }
}

export const htmlEntityDecode = defineTool({
  meta: {
    id: "encoding/html-entity-decode",
    name: "HTML Entity Decode",
    description:
      "Free online HTML entity decoder — convert HTML entities back to readable text instantly in your browser. No data is stored. Supports named entities (&amp;), numeric (&#38;), and hex (&#x26;) formats including special symbols and currency characters.",
    category: "encoding",
    subgroup: "Text Encoding",
    tier: ToolTier.CLIENT,
    keywords: ["html", "entity", "decode", "unescape", "amp", "lt", "gt"],
    examples: [
      {
        title: "Named Entities",
        description: "Decode common named HTML entities back to text",
        input: "&lt;div class=&quot;main&quot;&gt;Tom &amp; Jerry&lt;/div&gt;",
        output: '<div class="main">Tom & Jerry</div>',
      },
      {
        title: "Numeric Entities",
        description: "Decode numeric and hex HTML entities",
        input: "&#72;&#101;&#108;&#108;&#111; &#x57;&#x6F;&#x72;&#x6C;&#x64;",
        output: "Hello World",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
