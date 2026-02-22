import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { rgbToCmyk } from "./color-utils";

const inputSchema = z.object({
  input: z.string().describe("RGB color (e.g., '255, 87, 51')"),
});
const outputSchema = z.object({
  output: z.string().describe("CMYK color value"),
});

export const rgbToCmykTool = defineTool({
  meta: {
    id: "color/rgb-to-cmyk",
    name: "RGB to CMYK",
    description:
      "Free online RGB to CMYK converter — convert RGB screen color values to CMYK print color values instantly in your browser. No data is stored.",
    category: "color",
    subgroup: "Conversion",
    tier: ToolTier.CLIENT,
    keywords: ["rgb", "cmyk", "color", "convert", "print"],
    examples: [
      {
        title: "Convert Orange",
        description: "Convert an orange RGB color to CMYK for print",
        input: "255, 165, 0",
        output: "cmyk(0%, 35%, 100%, 0%)",
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
    const { c, m, y, k } = rgbToCmyk({ r, g, b });
    return {
      output: `cmyk(${Math.round(c * 100)}%, ${Math.round(m * 100)}%, ${Math.round(y * 100)}%, ${Math.round(k * 100)}%)`,
    };
  },
});
