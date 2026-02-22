import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { parseColorInput, rgbToHsl, hslToRgb, rgbToHex } from "./color-utils";

const inputSchema = z.object({
  input: z.string().describe("Color in any format"),
});
const optionsSchema = z.object({
  count: z.number().min(2).max(20).default(5).describe("Number of shades"),
});
const outputSchema = z.object({
  output: z.string().describe("Color shades (darker variants)"),
});

export const colorShades = defineTool({
  meta: {
    id: "color/color-shades",
    name: "Color Shades",
    description:
      "Free online color shade generator — create progressively darker variations of any color instantly in your browser. No data is stored. Configurable shade count from 2 to 20 steps.",
    category: "color",
    subgroup: "Generation",
    tier: ToolTier.CLIENT,
    keywords: ["shade", "dark", "darker", "color", "variation"],
    examples: [
      {
        title: "Shades of Blue",
        description: "Generate 5 progressively darker shades of blue",
        input: "#3498DB",
        output: "#3498DB\n#217BB8\n#185D8A\n#103E5C\n#081F2E",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute: (input, options) => {
    const rgb = parseColorInput(input.input);
    const hsl = rgbToHsl(rgb);
    const count = options?.count ?? 5;
    const colors: string[] = [];
    for (let i = 0; i < count; i++) {
      const l = hsl.l * (1 - i / count);
      colors.push(rgbToHex(hslToRgb({ h: hsl.h, s: hsl.s, l })));
    }
    return { output: colors.join("\n") };
  },
});
