import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("HTML entity encoded text to decode"),
});

const outputSchema = z.object({
  output: z.string().describe("Decoded text"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

const NAMED_ENTITY_MAP: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: "\u00a0",
  copy: "\u00a9",
  reg: "\u00ae",
  trade: "\u2122",
  ndash: "\u2013",
  mdash: "\u2014",
  lsquo: "\u2018",
  rsquo: "\u2019",
  ldquo: "\u201c",
  rdquo: "\u201d",
  hellip: "\u2026",
  deg: "\u00b0",
  plusmn: "\u00b1",
  times: "\u00d7",
  divide: "\u00f7",
  euro: "\u20ac",
  pound: "\u00a3",
  yen: "\u00a5",
  cent: "\u00a2",
  laquo: "\u00ab",
  raquo: "\u00bb",
  bull: "\u2022",
  middot: "\u00b7",
  iexcl: "\u00a1",
  iquest: "\u00bf",
  sect: "\u00a7",
  para: "\u00b6",
  micro: "\u00b5",
  frac14: "\u00bc",
  frac12: "\u00bd",
  frac34: "\u00be",
  sup1: "\u00b9",
  sup2: "\u00b2",
  sup3: "\u00b3",
  larr: "\u2190",
  rarr: "\u2192",
  uarr: "\u2191",
  darr: "\u2193",
  hearts: "\u2665",
  diams: "\u2666",
  clubs: "\u2663",
  spades: "\u2660",
};

function execute(input: Input): Output {
  const raw = input.input;
  if (!raw.trim()) {
    throw new Error("Input cannot be empty");
  }

  let result = raw;

  // Decode named entities
  result = result.replace(/&([a-zA-Z]+);/g, (_match: string, name: string) => {
    const lower: string = name.toLowerCase();
    return NAMED_ENTITY_MAP[lower] ?? _match;
  });

  // Decode numeric entities (decimal)
  result = result.replace(/&#(\d+);/g, (_match: string, code: string) => {
    const num = parseInt(code, 10);
    if (num > 0 && num <= 0x10ffff) {
      return String.fromCodePoint(num);
    }
    return _match;
  });

  // Decode numeric entities (hex)
  result = result.replace(
    /&#x([0-9a-fA-F]+);/g,
    (_match: string, code: string) => {
      const num = parseInt(code, 16);
      if (num > 0 && num <= 0x10ffff) {
        return String.fromCodePoint(num);
      }
      return _match;
    }
  );

  return { output: result };
}

export const htmlEntityDecoder = defineTool({
  meta: {
    id: "html/entity-decoder",
    name: "HTML Entity Decoder",
    description:
      "Free online HTML entity decoder — convert HTML entities back to readable characters instantly in your browser. No data is stored. Supports named entities (&amp;, &lt;, &copy;), decimal (&#38;), and hexadecimal (&#x26;) references.",
    category: "html",
    tier: ToolTier.CLIENT,
    keywords: [
      "html",
      "entity",
      "decode",
      "unescape",
      "special characters",
      "named entity",
      "numeric entity",
      "hex entity",
      "ampersand",
      "unicode",
    ],
    examples: [
      {
        title: "Decode escaped HTML markup",
        description:
          "Convert named HTML entities in escaped markup back to readable characters",
        input: "&lt;h1&gt;Hello &amp; World&lt;/h1&gt; &copy; 2025",
        output: "<h1>Hello & World</h1> \u00a9 2025",
      },
    ],
    ui: {
      outputRenderer: "code",
      outputLanguage: "html",
    },
  },
  inputSchema,
  outputSchema,
  execute,
});
