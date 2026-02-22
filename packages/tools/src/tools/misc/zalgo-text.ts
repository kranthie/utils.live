import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({ input: z.string().describe("Text to zalgofy") });
const optionsSchema = z.object({
  intensity: z
    .enum(["low", "medium", "high"])
    .default("medium")
    .describe("Zalgo intensity"),
});
const outputSchema = z.object({ output: z.string().describe("Zalgo text") });

const ZALGO_UP = [
  "\u0300",
  "\u0301",
  "\u0302",
  "\u0303",
  "\u0304",
  "\u0305",
  "\u0306",
  "\u0307",
  "\u0308",
  "\u0309",
  "\u030A",
  "\u030B",
  "\u030C",
  "\u030D",
  "\u030E",
  "\u030F",
  "\u0310",
  "\u0311",
  "\u0312",
  "\u0313",
  "\u0314",
  "\u0315",
  "\u031A",
  "\u033D",
  "\u033E",
  "\u033F",
  "\u0340",
  "\u0341",
  "\u0342",
  "\u0343",
  "\u0344",
  "\u0346",
  "\u034A",
  "\u034B",
  "\u034C",
];
const ZALGO_DOWN = [
  "\u0316",
  "\u0317",
  "\u0318",
  "\u0319",
  "\u031C",
  "\u031D",
  "\u031E",
  "\u031F",
  "\u0320",
  "\u0321",
  "\u0322",
  "\u0323",
  "\u0324",
  "\u0325",
  "\u0326",
  "\u0327",
  "\u0328",
  "\u0329",
  "\u032A",
  "\u032B",
  "\u032C",
  "\u032D",
  "\u032E",
  "\u032F",
  "\u0330",
  "\u0331",
  "\u0332",
  "\u0333",
  "\u0339",
  "\u033A",
  "\u033B",
  "\u033C",
  "\u0345",
  "\u0347",
  "\u0348",
  "\u0349",
];
const ZALGO_MID = ["\u0334", "\u0335", "\u0336", "\u0337", "\u0338"];

function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): z.infer<typeof outputSchema> {
  if (!input.input.trim()) throw new Error("Input cannot be empty");
  const level = options?.intensity ?? "medium";
  const counts = { low: 2, medium: 5, high: 10 };
  const n = counts[level];
  let seed = 42;
  const rng = (): number => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  let result = "";
  for (const ch of input.input) {
    result += ch;
    if (ch === " " || ch === "\n") continue;
    for (let i = 0; i < n; i++) {
      result += ZALGO_UP[Math.floor(rng() * ZALGO_UP.length)];
      result += ZALGO_DOWN[Math.floor(rng() * ZALGO_DOWN.length)];
      if (rng() > 0.5)
        result += ZALGO_MID[Math.floor(rng() * ZALGO_MID.length)];
    }
  }
  return { output: result };
}

export const zalgoText = defineTool({
  meta: {
    id: "misc/zalgo-text",
    name: "Zalgo Text",
    description:
      "Free online Zalgo text generator — add glitchy combining diacritics to any text instantly in your browser. No data is stored. Adjustable intensity (low, medium, high) controls how many combining characters are added above and below each letter.",
    category: "misc",
    subgroup: "Fun Tools",
    tier: ToolTier.CLIENT,
    keywords: [
      "zalgo",
      "glitch",
      "text",
      "creepy",
      "unicode",
      "fun",
      "combining",
      "diacritics",
    ],
    examples: [
      {
        title: "Medium-intensity Zalgo effect",
        description:
          "Adds combining marks above and below each letter for a glitchy appearance",
        input: "Hello",
        output:
          "H\u0314\u032a\u0337\u0340\u0330\u0334\u0301\u0320\u034c\u0331\u0335\u0308\u0319\u0338e\u0343\u0328\u0343\u0317\u0338\u0342\u031c\u031a\u0318\u0311\u0333l\u0312\u0316\u0336\u031a\u0331\u0338\u0308\u033b\u034a\u031d\u0335\u0300\u0329l\u0305\u0347\u030b\u032e\u0336\u0342\u032d\u0334\u0309\u0318\u0338\u0308\u033ao\u030e\u0318\u0305\u0324\u0338\u030e\u0325\u031a\u0326\u0340\u0327\u0334",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
