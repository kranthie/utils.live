import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { parseColorInput, rgbToHsl, hslToRgb, rgbToHex } from "./color-utils";

const inputSchema = z.object({
  input: z.string().describe("Color in any format"),
});
const outputSchema = z.object({
  output: z.string().describe("Triadic colors"),
});

export const triadicColors = defineTool({
  meta: {
    id: "color/triadic-colors",
    name: "Triadic Colors",
    description:
      "Free online triadic color finder — calculate three evenly-spaced colors on the color wheel from any input color instantly in your browser. No data is stored.",
    category: "color",
    subgroup: "Generation",
    tier: ToolTier.CLIENT,
    keywords: ["triadic", "color", "wheel", "harmony", "three"],
    examples: [
      {
        title: "Triadic of Red",
        description: "Find triadic colors for red (red, green, blue)",
        input: "#FF0000",
        output: "#FF0000\n#00FF00\n#0000FF",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const rgb = parseColorInput(input.input);
    const hsl = rgbToHsl(rgb);
    const colors = [0, 120, 240].map((offset) => {
      const h = (hsl.h + offset) % 360;
      return rgbToHex(hslToRgb({ h, s: hsl.s, l: hsl.l }));
    });
    return { output: colors.join("\n") };
  },
});
