import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { parseColorInput, rgbToHex } from "./color-utils";

const inputSchema = z.object({
  input1: z.string().describe("First color"),
  input2: z.string().describe("Second color"),
});
const optionsSchema = z.object({
  ratio: z
    .number()
    .min(0)
    .max(1)
    .default(0.5)
    .describe("Mix ratio (0 = all color1, 1 = all color2)"),
});
const outputSchema = z.object({
  original: z.string().describe("Input colors"),
  modified: z.string().describe("Mixed color result"),
});

export const colorMixer = defineTool({
  meta: {
    id: "color/color-mixer",
    name: "Color Mixer",
    description:
      "Free online color mixer — blend two colors together at any ratio to find the intermediate color instantly in your browser. No data is stored. Shows mixed color in hex and RGB formats.",
    category: "color",
    subgroup: "Analysis",
    tier: ToolTier.CLIENT,
    keywords: ["color", "mix", "blend", "combine", "interpolate", "ratio"],
    examples: [
      {
        title: "Mix Red and Blue",
        description: "Mix red and blue equally to get purple",
        input: { input1: "#FF0000", input2: "#0000FF" },
        output:
          "#FF0000 + #0000FF\nMixed (50%): #800080\nRGB: rgb(128, 0, 128)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute: (input, options) => {
    const c1 = parseColorInput(input.input1);
    const c2 = parseColorInput(input.input2);
    const ratio = options?.ratio ?? 0.5;
    const mixed = {
      r: Math.round(c1.r * (1 - ratio) + c2.r * ratio),
      g: Math.round(c1.g * (1 - ratio) + c2.g * ratio),
      b: Math.round(c1.b * (1 - ratio) + c2.b * ratio),
    };
    return {
      original: `${rgbToHex(c1)} + ${rgbToHex(c2)}`,
      modified: `Mixed (${Math.round(ratio * 100)}%): ${rgbToHex(mixed)}\nRGB: rgb(${mixed.r}, ${mixed.g}, ${mixed.b})`,
    };
  },
});
