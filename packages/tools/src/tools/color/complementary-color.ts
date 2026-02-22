import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { parseColorInput, rgbToHsl, hslToRgb, rgbToHex } from "./color-utils";

const inputSchema = z.object({
  input: z.string().describe("Color in any format"),
});
const outputSchema = z.object({
  output: z.string().describe("Complementary color"),
});

export const complementaryColor = defineTool({
  meta: {
    id: "color/complementary-color",
    name: "Complementary Color",
    description:
      "Free online complementary color finder — calculate the opposite color on the color wheel from any hex, RGB, or HSL input instantly in your browser. No data is stored.",
    category: "color",
    subgroup: "Generation",
    tier: ToolTier.CLIENT,
    keywords: ["complementary", "opposite", "color", "wheel"],
    examples: [
      {
        title: "Complement of Red",
        description: "Find the complementary color of red (cyan)",
        input: "#FF0000",
        output: "#FF0000 -> #00FFFF",
      },
      {
        title: "Complement of Blue",
        description: "Find the complementary color of blue",
        input: "#3498DB",
        output: "#3498DB -> #DB7734",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const rgb = parseColorInput(input.input);
    const hsl = rgbToHsl(rgb);
    const compHue = (hsl.h + 180) % 360;
    const comp = hslToRgb({ h: compHue, s: hsl.s, l: hsl.l });
    return { output: `${rgbToHex(rgb)} -> ${rgbToHex(comp)}` };
  },
});
