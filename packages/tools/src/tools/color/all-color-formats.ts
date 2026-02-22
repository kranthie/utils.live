import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import {
  parseColorInput,
  rgbToHex,
  rgbToHsl,
  rgbToHsv,
  rgbToCmyk,
} from "./color-utils";

const inputSchema = z.object({
  input: z
    .string()
    .describe("Color in any format (hex, rgb, hsl, or CSS name)"),
});
const outputSchema = z.object({
  output: z.string().describe("Color in all formats"),
});

export const allColorFormats = defineTool({
  meta: {
    id: "color/all-color-formats",
    name: "All Color Formats",
    description:
      "Free online color format converter — convert any color to hex, RGB, HSL, HSV, and CMYK formats instantly in your browser. No data is stored. Accepts hex codes, RGB values, HSL values, and CSS color names.",
    category: "color",
    subgroup: "Conversion",
    tier: ToolTier.CLIENT,
    keywords: [
      "color",
      "convert",
      "all",
      "formats",
      "hex",
      "rgb",
      "hsl",
      "hsv",
      "cmyk",
    ],
    examples: [
      {
        title: "Convert Coral",
        description: "View a hex color in all supported formats",
        input: "#FF6B6B",
        output:
          "Hex: #FF6B6B\nRGB: rgb(255, 107, 107)\nHSL: hsl(0, 100%, 71%)\nHSV: hsv(0, 58%, 100%)\nCMYK: cmyk(0%, 58%, 58%, 0%)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const rgb = parseColorInput(input.input);
    const hex = rgbToHex(rgb);
    const hsl = rgbToHsl(rgb);
    const hsv = rgbToHsv(rgb);
    const cmyk = rgbToCmyk(rgb);
    const lines = [
      `Hex: ${hex}`,
      `RGB: rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      `HSL: hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s * 100)}%, ${Math.round(hsl.l * 100)}%)`,
      `HSV: hsv(${Math.round(hsv.h)}, ${Math.round(hsv.s * 100)}%, ${Math.round(hsv.v * 100)}%)`,
      `CMYK: cmyk(${Math.round(cmyk.c * 100)}%, ${Math.round(cmyk.m * 100)}%, ${Math.round(cmyk.y * 100)}%, ${Math.round(cmyk.k * 100)}%)`,
    ];
    return { output: lines.join("\n") };
  },
});
