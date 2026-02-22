import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { parseColorInput, rgbToHsl, hslToRgb, rgbToHex } from "./color-utils";

const inputSchema = z.object({
  input: z.string().describe("Color in any format"),
});
const outputSchema = z.object({
  output: z.string().describe("Split complementary colors"),
});

export const splitComplementary = defineTool({
  meta: {
    id: "color/split-complementary",
    name: "Split Complementary",
    description:
      "Free online split complementary color finder — calculate the two colors adjacent to the complement on the color wheel instantly in your browser. No data is stored.",
    category: "color",
    subgroup: "Generation",
    tier: ToolTier.CLIENT,
    keywords: ["split", "complementary", "color", "wheel", "harmony"],
    examples: [
      {
        title: "Split Complementary of Red",
        description: "Find split complementary colors for red",
        input: "#FF0000",
        output: "#FF0000\n#00FF80\n#007FFF",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const rgb = parseColorInput(input.input);
    const hsl = rgbToHsl(rgb);
    const colors = [0, 150, 210].map((offset) => {
      const h = (hsl.h + offset) % 360;
      return rgbToHex(hslToRgb({ h, s: hsl.s, l: hsl.l }));
    });
    return { output: colors.join("\n") };
  },
});
