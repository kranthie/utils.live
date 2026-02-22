import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("SVG source code"),
});

const optionsSchema = z.object({
  fromColor: z.string().describe("Color to find (hex, rgb, or named color)"),
  toColor: z.string().describe("Replacement color (hex, rgb, or named color)"),
  replaceAll: z
    .boolean()
    .default(true)
    .describe("Replace all occurrences of the color"),
});

const outputSchema = z.object({
  output: z.string().describe("SVG with replaced colors"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

function execute(input: Input, options?: Options): Output {
  const svg = input.input.trim();
  if (!svg) throw new Error("SVG input cannot be empty");
  if (!options?.fromColor) throw new Error("fromColor is required");
  if (!options?.toColor) throw new Error("toColor is required");

  const from = options.fromColor;
  const to = options.toColor;

  // Replace in fill, stroke, stop-color, color attributes and style values
  let result = svg;

  // Case-insensitive replacement
  const fromRegex = new RegExp(
    escapeRegex(from),
    options.replaceAll ? "gi" : "i"
  );
  result = result.replace(fromRegex, to);

  return { output: result };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const svgColorChanger = defineTool({
  meta: {
    id: "svg/svg-color-changer",
    name: "SVG Color Changer",
    description:
      "Free online SVG color changer — find and replace colors in SVG source code instantly in your browser. No data is stored. Supports hex, RGB, and named colors with case-insensitive matching.",
    category: "svg",
    subgroup: "SVG Operations",
    tier: ToolTier.CLIENT,
    keywords: [
      "svg",
      "color",
      "change",
      "replace",
      "fill",
      "stroke",
      "find",
      "hex",
      "rgb",
      "theme",
      "rebrand",
    ],
    examples: [
      {
        title: "Recolor circle from red to blue",
        description: "Replace red with blue in an SVG",
        input:
          '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" fill="#FF0000"/></svg>',
        options: { fromColor: "#FF0000", toColor: "#3498DB" },
        output:
          '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" fill="#3498DB"/></svg>',
      },
    ],
    ui: {
      inputLanguage: "xml",
      outputLanguage: "xml",
    },
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
