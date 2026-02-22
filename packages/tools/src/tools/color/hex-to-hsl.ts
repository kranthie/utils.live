import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { parseHex, rgbToHsl } from "./color-utils";

const inputSchema = z.object({
  input: z.string().describe("Hex color (e.g., '#FF5733')"),
});
const outputSchema = z.object({
  output: z.string().describe("HSL color value"),
});

export const hexToHsl = defineTool({
  meta: {
    id: "color/hex-to-hsl",
    name: "Hex to HSL",
    description:
      "Free online hex to HSL converter — convert hex color codes to HSL (hue, saturation, lightness) format instantly in your browser. No data is stored.",
    category: "color",
    subgroup: "Conversion",
    tier: ToolTier.CLIENT,
    keywords: ["hex", "hsl", "color", "convert"],
    examples: [
      {
        title: "Convert Tomato Red",
        description: "Convert a red-orange hex color to HSL",
        input: "#FF6347",
        output: "hsl(9, 100%, 64%)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const rgb = parseHex(input.input);
    const { h, s, l } = rgbToHsl(rgb);
    return {
      output: `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`,
    };
  },
});
