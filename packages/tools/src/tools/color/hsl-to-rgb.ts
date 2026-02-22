import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { hslToRgb } from "./color-utils";

const inputSchema = z.object({
  input: z
    .string()
    .describe("HSL color (e.g., 'hsl(9, 100%, 60%)' or '9, 100, 60')"),
});
const outputSchema = z.object({
  output: z.string().describe("RGB color value"),
});

export const hslToRgbTool = defineTool({
  meta: {
    id: "color/hsl-to-rgb",
    name: "HSL to RGB",
    description:
      "Free online HSL to RGB converter — convert HSL color values to RGB format instantly in your browser. No data is stored.",
    category: "color",
    subgroup: "Conversion",
    tier: ToolTier.CLIENT,
    keywords: ["hsl", "rgb", "color", "convert"],
    examples: [
      {
        title: "Convert HSL Green",
        description: "Convert a green HSL value to RGB",
        input: "hsl(120, 100%, 50%)",
        output: "rgb(0, 255, 0)",
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
    const { r, g, b } = hslToRgb({ h, s, l });
    return { output: `rgb(${r}, ${g}, ${b})` };
  },
});
