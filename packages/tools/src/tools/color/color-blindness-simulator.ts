import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { parseColorInput, rgbToHex } from "./color-utils";

const inputSchema = z.object({
  input: z.string().describe("Color in any format"),
});
const outputSchema = z.object({
  output: z.string().describe("Simulated color blindness results"),
});

// Simplified color blindness simulation matrices
function simulateProtanopia(
  r: number,
  g: number,
  b: number
): [number, number, number] {
  return [
    Math.round(0.567 * r + 0.433 * g),
    Math.round(0.558 * r + 0.442 * g),
    Math.round(0.242 * g + 0.758 * b),
  ];
}

function simulateDeuteranopia(
  r: number,
  g: number,
  b: number
): [number, number, number] {
  return [
    Math.round(0.625 * r + 0.375 * g),
    Math.round(0.7 * r + 0.3 * g),
    Math.round(0.3 * g + 0.7 * b),
  ];
}

function simulateTritanopia(
  r: number,
  g: number,
  b: number
): [number, number, number] {
  return [
    Math.round(0.95 * r + 0.05 * g),
    Math.round(0.433 * g + 0.567 * b),
    Math.round(0.475 * g + 0.525 * b),
  ];
}

function simulateAchromatopsia(
  r: number,
  g: number,
  b: number
): [number, number, number] {
  const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  return [gray, gray, gray];
}

function clamp(v: number): number {
  return Math.max(0, Math.min(255, v));
}

export const colorBlindnessSimulator = defineTool({
  meta: {
    id: "color/color-blindness-simulator",
    name: "Color Blindness Simulator",
    description:
      "Free online color blindness simulator — preview how colors appear with protanopia, deuteranopia, tritanopia, and achromatopsia instantly in your browser. No data is stored. Helps test color accessibility.",
    category: "color",
    subgroup: "Analysis",
    tier: ToolTier.CLIENT,
    keywords: [
      "color",
      "blindness",
      "accessibility",
      "protanopia",
      "deuteranopia",
    ],
    examples: [
      {
        title: "Simulate Red",
        description:
          "See how pure red appears with different types of color blindness",
        input: "#FF0000",
        output:
          "Original: #FF0000\n\nProtanopia (no red): #918E00\nDeuteranopia (no green): #9FB300\nTritanopia (no blue): #F20000\nAchromatopsia (no color): #4C4C4C",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const rgb = parseColorInput(input.input);
    const original = rgbToHex(rgb);

    const sims: [
      string,
      (r: number, g: number, b: number) => [number, number, number],
    ][] = [
      ["Protanopia (no red)", simulateProtanopia],
      ["Deuteranopia (no green)", simulateDeuteranopia],
      ["Tritanopia (no blue)", simulateTritanopia],
      ["Achromatopsia (no color)", simulateAchromatopsia],
    ];

    const lines = [`Original: ${original}`, ``];
    for (const [name, fn] of sims) {
      const result = fn(rgb.r, rgb.g, rgb.b).map(clamp);
      lines.push(
        `${name}: ${rgbToHex({ r: result[0] ?? 0, g: result[1] ?? 0, b: result[2] ?? 0 })}`
      );
    }
    return { output: lines.join("\n") };
  },
});
