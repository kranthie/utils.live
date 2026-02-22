import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { parseColorInput, perceivedBrightness, rgbToHex } from "./color-utils";

const inputSchema = z.object({
  input: z.string().describe("Color in any format"),
});
const outputSchema = z.object({
  output: z.string().describe("Brightness result"),
});

export const colorBrightness = defineTool({
  meta: {
    id: "color/color-brightness",
    name: "Color Brightness",
    description:
      "Free online color brightness calculator — compute perceived brightness using the standard luminance formula (0.299R + 0.587G + 0.114B) instantly in your browser. No data is stored. Classifies colors as light or dark.",
    category: "color",
    subgroup: "Analysis",
    tier: ToolTier.CLIENT,
    keywords: ["brightness", "perceived", "color", "light", "dark"],
    examples: [
      {
        title: "Dark Color",
        description: "Check brightness of a dark navy color",
        input: "#1A1A2E",
        output: "Color: #1A1A2E\nBrightness: 28.3 / 255\nCategory: Dark",
      },
      {
        title: "Light Color",
        description: "Check brightness of a light yellow",
        input: "#FFFACD",
        output: "Color: #FFFACD\nBrightness: 246.4 / 255\nCategory: Light",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const rgb = parseColorInput(input.input);
    const brightness = perceivedBrightness(rgb);
    const category = brightness < 128 ? "Dark" : "Light";
    return {
      output: `Color: ${rgbToHex(rgb)}\nBrightness: ${brightness.toFixed(1)} / 255\nCategory: ${category}`,
    };
  },
});
