import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { hslToRgb, rgbToHex } from "./color-utils";

const inputSchema = z.object({
  input: z
    .string()
    .describe("HSL color (e.g., 'hsl(9, 100%, 60%)' or '9, 100, 60')"),
});
const outputSchema = z.object({
  output: z.string().describe("Hex color value"),
});

export const hslToHexTool = defineTool({
  meta: {
    id: "color/hsl-to-hex",
    name: "HSL to Hex",
    description:
      "Free online HSL to hex converter — convert HSL color values to hex codes instantly in your browser. No data is stored.",
    category: "color",
    subgroup: "Conversion",
    tier: ToolTier.CLIENT,
    keywords: ["hsl", "hex", "color", "convert"],
    examples: [
      {
        title: "Convert HSL Blue",
        description: "Convert a blue HSL value to hex",
        input: "hsl(210, 100%, 50%)",
        output: "#007FFF",
      },
      {
        title: "Plain HSL Values",
        description: "Convert plain comma-separated HSL values",
        input: "0, 100, 50",
        output: "#FF0000",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const match = input.input.match(
      /([\d.]+)\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?/
    );
    if (!match || !match[1] || !match[2] || !match[3])
      throw new Error("Invalid HSL format");
    const h = parseFloat(match[1]);
    const s = parseFloat(match[2]) / 100;
    const l = parseFloat(match[3]) / 100;
    const rgb = hslToRgb({ h, s, l });
    return { output: rgbToHex(rgb) };
  },
});
