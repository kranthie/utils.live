import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { parseColorInput, rgbToHsl, hslToRgb, rgbToHex } from "./color-utils";

const inputSchema = z.object({
  input: z.string().describe("Color in any format"),
});
const optionsSchema = z.object({
  count: z.number().min(2).max(20).default(5).describe("Number of tints"),
});
const outputSchema = z.object({
  output: z.string().describe("Color tints (lighter variants)"),
});

export const colorTints = defineTool({
  meta: {
    id: "color/color-tints",
    name: "Color Tints",
    description:
      "Free online color tint generator — create progressively lighter variations of any color instantly in your browser. No data is stored. Configurable tint count from 2 to 20 steps.",
    category: "color",
    subgroup: "Generation",
    tier: ToolTier.CLIENT,
    keywords: ["tint", "light", "lighter", "color", "variation"],
    examples: [
      {
        title: "Tints of Red",
        description: "Generate lighter tints of red",
        input: "#E74C3C",
        output: "#E74C3C\n#ED796D\n#F3A69E\n#F9D2CE\n#FFFFFF",
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
      const l = hsl.l + (1 - hsl.l) * (i / (count - 1));
      colors.push(
        rgbToHex(hslToRgb({ h: hsl.h, s: hsl.s, l: Math.min(l, 1) }))
      );
    }
    return { output: colors.join("\n") };
  },
});
