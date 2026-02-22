import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { parseColorInput, rgbToHex } from "./color-utils";

const inputSchema = z.object({
  input: z.string().describe("Color in any format"),
});
const outputSchema = z.object({
  output: z.string().describe("Inverted color"),
});

export const colorInverter = defineTool({
  meta: {
    id: "color/color-inverter",
    name: "Color Inverter",
    description:
      "Free online color inverter — compute the complementary inverse of any hex, RGB, or HSL color instantly in your browser. No data is stored. Shows original and inverted color with hex and RGB values.",
    category: "color",
    subgroup: "Analysis",
    tier: ToolTier.CLIENT,
    keywords: ["color", "invert", "negate", "negative", "opposite"],
    examples: [
      {
        title: "Invert Coral",
        description: "Invert a coral color to get its negative",
        input: "#FF6B6B",
        output: "#FF6B6B -> #009494",
      },
      {
        title: "Invert White",
        description: "Invert white to get black",
        input: "#FFFFFF",
        output: "#FFFFFF -> #000000",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const rgb = parseColorInput(input.input);
    const inverted = { r: 255 - rgb.r, g: 255 - rgb.g, b: 255 - rgb.b };
    return { output: `${rgbToHex(rgb)} -> ${rgbToHex(inverted)}` };
  },
});
