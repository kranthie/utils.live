import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import {
  parseColorInput,
  rgbToHex,
  rgbToHsl,
  rgbToHsv,
  rgbToCmyk,
  perceivedBrightness,
  relativeLuminance,
} from "./color-utils";

const inputSchema = z.object({
  input: z.string().describe("Color in any format"),
});
const outputSchema = z.object({ output: z.string().describe("Color details") });

export const colorPicker = defineTool({
  meta: {
    id: "color/color-picker",
    name: "Color Picker",
    description:
      "Free online color picker — enter any hex, RGB, or HSL color and view detailed info including all format conversions and perceived brightness instantly in your browser. No data is stored.",
    category: "color",
    subgroup: "Generation",
    tier: ToolTier.CLIENT,
    keywords: [
      "color",
      "picker",
      "details",
      "info",
      "hex",
      "rgb",
      "hsl",
      "inspect",
    ],
    examples: [
      {
        title: "Inspect Coral",
        description: "View all details for a coral color",
        input: "#FF6B6B",
        output:
          "Hex: #FF6B6B\nRGB: rgb(255, 107, 107)\nHSL: hsl(0, 100%, 71%)\nHSV: hsv(0, 58%, 100%)\nCMYK: cmyk(0%, 58%, 58%, 0%)\nBrightness: 151 (light)\nLuminance: 0.3284",
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
    const brightness = perceivedBrightness(rgb);
    const luminance = relativeLuminance(rgb);
    const isDark = brightness < 128;
    const lines = [
      `Hex: ${hex}`,
      `RGB: rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      `HSL: hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s * 100)}%, ${Math.round(hsl.l * 100)}%)`,
      `HSV: hsv(${Math.round(hsv.h)}, ${Math.round(hsv.s * 100)}%, ${Math.round(hsv.v * 100)}%)`,
      `CMYK: cmyk(${Math.round(cmyk.c * 100)}%, ${Math.round(cmyk.m * 100)}%, ${Math.round(cmyk.y * 100)}%, ${Math.round(cmyk.k * 100)}%)`,
      `Brightness: ${brightness.toFixed(0)} (${isDark ? "dark" : "light"})`,
      `Luminance: ${luminance.toFixed(4)}`,
    ];
    return { output: lines.join("\n") };
  },
});
