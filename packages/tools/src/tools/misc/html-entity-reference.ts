import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  filter: z
    .string()
    .optional()
    .describe("Filter by entity name, character, or code"),
});
const outputSchema = z.object({
  output: z.string().describe("HTML entities reference"),
});

const ENTITIES: Array<[string, string, string, string]> = [
  ["&amp;", "&", "&#38;", "Ampersand"],
  ["&lt;", "<", "&#60;", "Less than"],
  ["&gt;", ">", "&#62;", "Greater than"],
  ["&quot;", '"', "&#34;", "Quotation mark"],
  ["&apos;", "'", "&#39;", "Apostrophe"],
  ["&nbsp;", " ", "&#160;", "Non-breaking space"],
  ["&copy;", "\u00A9", "&#169;", "Copyright"],
  ["&reg;", "\u00AE", "&#174;", "Registered"],
  ["&trade;", "\u2122", "&#8482;", "Trademark"],
  ["&euro;", "\u20AC", "&#8364;", "Euro"],
  ["&pound;", "\u00A3", "&#163;", "Pound"],
  ["&yen;", "\u00A5", "&#165;", "Yen"],
  ["&cent;", "\u00A2", "&#162;", "Cent"],
  ["&deg;", "\u00B0", "&#176;", "Degree"],
  ["&plusmn;", "\u00B1", "&#177;", "Plus-minus"],
  ["&times;", "\u00D7", "&#215;", "Multiplication"],
  ["&divide;", "\u00F7", "&#247;", "Division"],
  ["&frac12;", "\u00BD", "&#189;", "Half"],
  ["&frac14;", "\u00BC", "&#188;", "Quarter"],
  ["&frac34;", "\u00BE", "&#190;", "Three-quarters"],
  ["&ndash;", "\u2013", "&#8211;", "En dash"],
  ["&mdash;", "\u2014", "&#8212;", "Em dash"],
  ["&lsquo;", "\u2018", "&#8216;", "Left single quote"],
  ["&rsquo;", "\u2019", "&#8217;", "Right single quote"],
  ["&ldquo;", "\u201C", "&#8220;", "Left double quote"],
  ["&rdquo;", "\u201D", "&#8221;", "Right double quote"],
  ["&bull;", "\u2022", "&#8226;", "Bullet"],
  ["&hellip;", "\u2026", "&#8230;", "Ellipsis"],
  ["&larr;", "\u2190", "&#8592;", "Left arrow"],
  ["&rarr;", "\u2192", "&#8594;", "Right arrow"],
  ["&uarr;", "\u2191", "&#8593;", "Up arrow"],
  ["&darr;", "\u2193", "&#8595;", "Down arrow"],
  ["&laquo;", "\u00AB", "&#171;", "Left guillemet"],
  ["&raquo;", "\u00BB", "&#187;", "Right guillemet"],
  ["&sect;", "\u00A7", "&#167;", "Section"],
  ["&para;", "\u00B6", "&#182;", "Paragraph"],
  ["&micro;", "\u00B5", "&#181;", "Micro"],
  ["&middot;", "\u00B7", "&#183;", "Middle dot"],
  ["&iexcl;", "\u00A1", "&#161;", "Inverted exclamation"],
  ["&iquest;", "\u00BF", "&#191;", "Inverted question"],
  ["&infin;", "\u221E", "&#8734;", "Infinity"],
  ["&hearts;", "\u2665", "&#9829;", "Heart"],
  ["&diams;", "\u2666", "&#9830;", "Diamond"],
  ["&clubs;", "\u2663", "&#9827;", "Club"],
  ["&spades;", "\u2660", "&#9824;", "Spade"],
  ["&check;", "\u2713", "&#10003;", "Check mark"],
  ["&cross;", "\u2717", "&#10007;", "Cross mark"],
  ["&star;", "\u2605", "&#9733;", "Star"],
];

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  let filtered = ENTITIES;
  if (input.filter) {
    const q = input.filter.toLowerCase();
    filtered = filtered.filter(
      ([entity, , code, desc]) =>
        entity.toLowerCase().includes(q) ||
        code.includes(q) ||
        desc.toLowerCase().includes(q)
    );
  }
  const header = `${"Entity".padEnd(14)} ${"Char".padEnd(5)} ${"Code".padEnd(10)} Description`;
  const lines = filtered.map(
    ([entity, ch, code, desc]) =>
      `${entity.padEnd(14)} ${ch.padEnd(5)} ${code.padEnd(10)} ${desc}`
  );
  return { output: [header, "-".repeat(50), ...lines].join("\n") };
}

export const htmlEntityReference = defineTool({
  meta: {
    id: "misc/html-entity-reference",
    name: "HTML Entity Reference",
    description:
      "Free online HTML entity reference — look up named entities, characters, and numeric codes instantly in your browser. No data is stored. Covers 45+ common entities including symbols, arrows, currency signs, and punctuation.",
    category: "misc",
    subgroup: "Reference",
    tier: ToolTier.CLIENT,
    keywords: [
      "html",
      "entity",
      "reference",
      "character",
      "special",
      "symbol",
      "ampersand",
      "named",
      "numeric",
    ],
    examples: [
      {
        title: "Look up arrow symbols",
        description: "Filter HTML entities to find arrow symbols",
        input: { filter: "arrow" },
        output:
          "Entity         Char  Code       Description\n--------------------------------------------------\n&larr;         \u2190     &#8592;    Left arrow\n&rarr;         \u2192     &#8594;    Right arrow\n&uarr;         \u2191     &#8593;    Up arrow\n&darr;         \u2193     &#8595;    Down arrow",
      },
      {
        title: "Find the copyright symbol entity",
        description: "Look up the copyright HTML entity by name",
        input: { filter: "copyright" },
        output:
          "Entity         Char  Code       Description\n--------------------------------------------------\n&copy;         \u00A9     &#169;     Copyright",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
