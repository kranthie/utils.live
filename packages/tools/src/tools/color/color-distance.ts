import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { parseColorInput, rgbToHex } from "./color-utils";

const inputSchema = z.object({
  input1: z.string().describe("First color"),
  input2: z.string().describe("Second color"),
});
const outputSchema = z.object({
  original: z.string().describe("First color info"),
  modified: z.string().describe("Second color info and distance"),
});

// Simplified CIE76 deltaE using Lab approximation
function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  // Linearize sRGB
  let rl = r / 255,
    gl = g / 255,
    bl = b / 255;
  rl = rl > 0.04045 ? Math.pow((rl + 0.055) / 1.055, 2.4) : rl / 12.92;
  gl = gl > 0.04045 ? Math.pow((gl + 0.055) / 1.055, 2.4) : gl / 12.92;
  bl = bl > 0.04045 ? Math.pow((bl + 0.055) / 1.055, 2.4) : bl / 12.92;
  // To XYZ (D65)
  let x = (0.4124 * rl + 0.3576 * gl + 0.1805 * bl) / 0.95047;
  let y = (0.2126 * rl + 0.7152 * gl + 0.0722 * bl) / 1.0;
  let z2 = (0.0193 * rl + 0.1192 * gl + 0.9505 * bl) / 1.08883;
  const f = (t: number): number =>
    t > 0.008856 ? Math.pow(t, 1 / 3) : 7.787 * t + 16 / 116;
  x = f(x);
  y = f(y);
  z2 = f(z2);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z2)];
}

export const colorDistance = defineTool({
  meta: {
    id: "color/color-distance",
    name: "Color Distance",
    description:
      "Free online color distance calculator — compute the perceptual distance (Delta E / CIE76) between two colors in CIE Lab color space instantly in your browser. No data is stored. Measures how different two colors appear to the human eye.",
    category: "color",
    subgroup: "Analysis",
    tier: ToolTier.CLIENT,
    keywords: ["color", "distance", "difference", "deltaE", "compare"],
    examples: [
      {
        title: "Compare Red and Blue",
        description: "Calculate the perceptual distance between red and blue",
        input: { input1: "#FF0000", input2: "#0000FF" },
        output:
          "Color 1: #FF0000\nColor 2: #0000FF\n\nDelta E: 176.33\nPerception: Very different",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const c1 = parseColorInput(input.input1);
    const c2 = parseColorInput(input.input2);
    const [l1, a1, b1] = rgbToLab(c1.r, c1.g, c1.b);
    const [l2, a2, b2] = rgbToLab(c2.r, c2.g, c2.b);
    const deltaE = Math.sqrt((l1 - l2) ** 2 + (a1 - a2) ** 2 + (b1 - b2) ** 2);

    let perception = "Identical";
    if (deltaE > 100) perception = "Very different";
    else if (deltaE > 49) perception = "Different";
    else if (deltaE > 12) perception = "Noticeable";
    else if (deltaE > 5) perception = "Slightly noticeable";
    else if (deltaE > 2) perception = "Barely noticeable";
    else if (deltaE > 1) perception = "Almost identical";

    return {
      original: `Color 1: ${rgbToHex(c1)}`,
      modified: `Color 2: ${rgbToHex(c2)}\n\nDelta E: ${deltaE.toFixed(2)}\nPerception: ${perception}`,
    };
  },
});
