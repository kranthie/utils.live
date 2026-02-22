import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { cmykToRgb } from "./color-utils";

const inputSchema = z.object({
  input: z
    .string()
    .describe("CMYK color (e.g., '0, 66, 80, 0' or 'cmyk(0%, 66%, 80%, 0%)')"),
});
const outputSchema = z.object({
  output: z.string().describe("RGB color value"),
});

export const cmykToRgbTool = defineTool({
  meta: {
    id: "color/cmyk-to-rgb",
    name: "CMYK to RGB",
    description:
      "Free online CMYK to RGB converter — convert CMYK print color values to RGB screen color values instantly in your browser. No data is stored.",
    category: "color",
    subgroup: "Conversion",
    tier: ToolTier.CLIENT,
    keywords: ["cmyk", "rgb", "color", "convert", "print"],
    examples: [
      {
        title: "Convert Cyan CMYK",
        description: "Convert a pure cyan CMYK value to RGB",
        input: "cmyk(100%, 0%, 0%, 0%)",
        output: "rgb(0, 255, 255)",
      },
      {
        title: "Plain CMYK Values",
        description: "Convert comma-separated CMYK values",
        input: "0, 100, 100, 0",
        output: "rgb(255, 0, 0)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const match = input.input.match(
      /([\d.]+)%?\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?/
    );
    if (!match || !match[1] || !match[2] || !match[3] || !match[4])
      throw new Error("Invalid CMYK format");
    let c = parseFloat(match[1]),
      m = parseFloat(match[2]),
      y = parseFloat(match[3]),
      k = parseFloat(match[4]);
    // If values > 1, assume percentage
    if (c > 1 || m > 1 || y > 1 || k > 1) {
      c /= 100;
      m /= 100;
      y /= 100;
      k /= 100;
    }
    const rgb = cmykToRgb({ c, m, y, k });
    return { output: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` };
  },
});
