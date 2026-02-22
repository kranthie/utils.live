import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { parseHex, CSS_COLORS } from "./color-utils";

const inputSchema = z.object({
  input: z.string().describe("Hex color (e.g., '#FF7F50')"),
});
const outputSchema = z.object({
  output: z.string().describe("Nearest CSS color name"),
});

function colorDistance(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number
): number {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

export const hexToColorName = defineTool({
  meta: {
    id: "color/hex-to-color-name",
    name: "Hex to Color Name",
    description:
      "Free online hex to color name converter — find the nearest CSS color name for any hex code instantly in your browser. No data is stored. Matches against all 148 CSS named colors.",
    category: "color",
    subgroup: "Conversion",
    tier: ToolTier.CLIENT,
    keywords: ["hex", "color", "name", "css", "nearest"],
    examples: [
      {
        title: "Exact Match",
        description: "Find the CSS name for an exact hex match",
        input: "#FF7F50",
        output: "coral (exact match)",
      },
      {
        title: "Nearest Match",
        description: "Find the closest CSS color name for a hex code",
        input: "#FF6B6B",
        output: "salmon (distance: 22.69)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const { r, g, b } = parseHex(input.input);
    let bestName = "";
    let bestDist = Infinity;
    for (const [name, hex] of Object.entries(CSS_COLORS)) {
      const c = parseHex(hex);
      const dist = colorDistance(r, g, b, c.r, c.g, c.b);
      if (dist < bestDist) {
        bestDist = dist;
        bestName = name;
      }
    }
    const exact =
      bestDist === 0 ? " (exact match)" : ` (distance: ${bestDist.toFixed(2)})`;
    return { output: `${bestName}${exact}` };
  },
});
