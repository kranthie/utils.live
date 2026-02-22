import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { parseColorInput, rgbToHsl, hslToRgb, rgbToHex } from "./color-utils";

const inputSchema = z.object({
  input: z.string().describe("Color in any format"),
});
const outputSchema = z.object({
  output: z.string().describe("Analogous colors"),
});

export const analogousColors = defineTool({
  meta: {
    id: "color/analogous-colors",
    name: "Analogous Colors",
    description:
      "Free online analogous color finder — generate adjacent colors on the color wheel from any hex, RGB, or HSL input instantly in your browser. No data is stored. Shows 5 harmonious neighboring hues.",
    category: "color",
    subgroup: "Generation",
    tier: ToolTier.CLIENT,
    keywords: ["analogous", "adjacent", "color", "wheel", "harmony"],
    examples: [
      {
        title: "Analogous of Blue",
        description:
          "Find analogous colors adjacent to blue on the color wheel",
        input: "#3498DB",
        output: "#34DBCB\n#3498DB\n#3445DB",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const rgb = parseColorInput(input.input);
    const hsl = rgbToHsl(rgb);
    const colors = [-30, 0, 30].map((offset) => {
      const h = (hsl.h + offset + 360) % 360;
      return rgbToHex(hslToRgb({ h, s: hsl.s, l: hsl.l }));
    });
    return { output: colors.join("\n") };
  },
});
