import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { rgbToHsl } from "./color-utils";

const inputSchema = z.object({
  input: z
    .string()
    .describe("RGB color (e.g., 'rgb(255, 87, 51)' or '255, 87, 51')"),
});
const outputSchema = z.object({
  output: z.string().describe("HSL color value"),
});

export const rgbToHslTool = defineTool({
  meta: {
    id: "color/rgb-to-hsl",
    name: "RGB to HSL",
    description:
      "Free online RGB to HSL converter — convert RGB color values to HSL (hue, saturation, lightness) format instantly in your browser. No data is stored.",
    category: "color",
    subgroup: "Conversion",
    tier: ToolTier.CLIENT,
    keywords: ["rgb", "hsl", "color", "convert"],
    examples: [
      {
        title: "Convert Pure Red",
        description: "Convert pure red RGB to HSL",
        input: "255, 0, 0",
        output: "hsl(0, 100%, 50%)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const match = input.input.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (!match || !match[1] || !match[2] || !match[3])
      throw new Error("Invalid RGB format");
    const r = parseInt(match[1]),
      g = parseInt(match[2]),
      b = parseInt(match[3]);
    const { h, s, l } = rgbToHsl({ r, g, b });
    return {
      output: `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`,
    };
  },
});
