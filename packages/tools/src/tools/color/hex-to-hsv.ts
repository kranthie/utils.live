import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { parseHex, rgbToHsv } from "./color-utils";

const inputSchema = z.object({
  input: z.string().describe("Hex color (e.g., '#FF5733')"),
});
const outputSchema = z.object({
  output: z.string().describe("HSV color value"),
});

export const hexToHsv = defineTool({
  meta: {
    id: "color/hex-to-hsv",
    name: "Hex to HSV",
    description:
      "Free online hex to HSV converter — convert hex color codes to HSV (hue, saturation, value) format instantly in your browser. No data is stored.",
    category: "color",
    subgroup: "Conversion",
    tier: ToolTier.CLIENT,
    keywords: ["hex", "hsv", "hsb", "color", "convert"],
    examples: [
      {
        title: "Convert Teal",
        description: "Convert a teal hex color to HSV",
        input: "#008080",
        output: "hsv(180, 100%, 50%)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const rgb = parseHex(input.input);
    const { h, s, v } = rgbToHsv(rgb);
    return {
      output: `hsv(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(v * 100)}%)`,
    };
  },
});
