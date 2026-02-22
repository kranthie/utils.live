import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { parseColorInput, relativeLuminance, rgbToHex } from "./color-utils";

const inputSchema = z.object({
  input: z.string().describe("Color in any format"),
});
const outputSchema = z.object({
  output: z.string().describe("Luminance result"),
});

export const colorLuminance = defineTool({
  meta: {
    id: "color/color-luminance",
    name: "Color Luminance",
    description:
      "Free online color luminance calculator — compute relative luminance per WCAG 2.0 standards for accessibility testing instantly in your browser. No data is stored.",
    category: "color",
    subgroup: "Analysis",
    tier: ToolTier.CLIENT,
    keywords: ["luminance", "relative", "wcag", "color", "brightness"],
    examples: [
      {
        title: "White Luminance",
        description: "Calculate relative luminance of white",
        input: "#FFFFFF",
        output:
          "Color: #FFFFFF\nRelative Luminance: 1.000000\nRange: 0 (black) to 1 (white)",
      },
      {
        title: "Mid-gray Luminance",
        description: "Calculate relative luminance of a mid-gray",
        input: "#808080",
        output:
          "Color: #808080\nRelative Luminance: 0.215861\nRange: 0 (black) to 1 (white)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const rgb = parseColorInput(input.input);
    const luminance = relativeLuminance(rgb);
    return {
      output: `Color: ${rgbToHex(rgb)}\nRelative Luminance: ${luminance.toFixed(6)}\nRange: 0 (black) to 1 (white)`,
    };
  },
});
