import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { parseColorInput, contrastRatio, rgbToHex } from "./color-utils";

const inputSchema = z.object({
  input1: z.string().describe("Foreground color"),
  input2: z.string().describe("Background color"),
});
const outputSchema = z.object({
  original: z.string().describe("Foreground color details"),
  modified: z.string().describe("Background color details"),
});

export const contrastChecker = defineTool({
  meta: {
    id: "color/contrast-checker",
    name: "Contrast Checker",
    description:
      "Free online WCAG contrast checker — calculate contrast ratio between foreground and background colors and test AA/AAA compliance instantly in your browser. No data is stored. Checks normal and large text requirements.",
    category: "color",
    subgroup: "Analysis",
    tier: ToolTier.CLIENT,
    keywords: ["contrast", "wcag", "accessibility", "a11y", "ratio"],
    examples: [
      {
        title: "Black on White",
        description: "Check contrast ratio of black text on white background",
        input: { input1: "#000000", input2: "#FFFFFF" },
        output:
          "Foreground: #000000\nBackground: #FFFFFF\n\nContrast Ratio: 21.00:1\n\nWCAG AA Normal Text (4.5:1): PASS\nWCAG AA Large Text (3:1): PASS\nWCAG AAA Normal Text (7:1): PASS\nWCAG AAA Large Text (4.5:1): PASS",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const fg = parseColorInput(input.input1);
    const bg = parseColorInput(input.input2);
    const ratio = contrastRatio(fg, bg);
    const passAA = ratio >= 4.5;
    const passAALarge = ratio >= 3;
    const passAAA = ratio >= 7;
    const passAAALarge = ratio >= 4.5;

    const result = [
      `Contrast Ratio: ${ratio.toFixed(2)}:1`,
      ``,
      `WCAG AA Normal Text (4.5:1): ${passAA ? "PASS" : "FAIL"}`,
      `WCAG AA Large Text (3:1): ${passAALarge ? "PASS" : "FAIL"}`,
      `WCAG AAA Normal Text (7:1): ${passAAA ? "PASS" : "FAIL"}`,
      `WCAG AAA Large Text (4.5:1): ${passAAALarge ? "PASS" : "FAIL"}`,
    ].join("\n");

    return {
      original: `Foreground: ${rgbToHex(fg)}`,
      modified: `Background: ${rgbToHex(bg)}\n\n${result}`,
    };
  },
});
