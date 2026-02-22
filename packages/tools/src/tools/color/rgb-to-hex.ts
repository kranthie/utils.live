import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { rgbToHex } from "./color-utils";

const inputSchema = z.object({
  input: z
    .string()
    .describe("RGB color (e.g., 'rgb(255, 87, 51)' or '255, 87, 51')"),
});
const outputSchema = z.object({
  output: z.string().describe("Hex color value"),
});

export const rgbToHexTool = defineTool({
  meta: {
    id: "color/rgb-to-hex",
    name: "RGB to Hex",
    description:
      "Free online RGB to hex converter — convert RGB color values to hex codes instantly in your browser. No data is stored.",
    category: "color",
    subgroup: "Conversion",
    tier: ToolTier.CLIENT,
    keywords: ["rgb", "hex", "color", "convert"],
    examples: [
      {
        title: "Convert RGB to Hex",
        description: "Convert an RGB color value to hex notation",
        input: "rgb(255, 87, 51)",
        output: "#FF5733",
      },
      {
        title: "Plain RGB Values",
        description: "Convert comma-separated RGB values",
        input: "66, 135, 245",
        output: "#4287F5",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const match = input.input.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (!match || !match[1] || !match[2] || !match[3])
      throw new Error("Invalid RGB format. Use 'r, g, b' or 'rgb(r, g, b)'");
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    if ([r, g, b].some((v) => v < 0 || v > 255))
      throw new Error("RGB values must be 0-255");
    return { output: rgbToHex({ r, g, b }) };
  },
});
