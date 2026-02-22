import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { parseColorInput, rgbToHex } from "./color-utils";

const inputSchema = z.object({
  color1: z.string().default("#FF0000").describe("Start color"),
  color2: z.string().default("#0000FF").describe("End color"),
  direction: z
    .enum([
      "to right",
      "to left",
      "to bottom",
      "to top",
      "45deg",
      "135deg",
      "radial",
    ])
    .default("to right")
    .describe("Gradient direction"),
  steps: z.number().min(2).max(20).default(5).describe("Number of color stops"),
});

const outputSchema = z.object({
  output: z.string().describe("CSS gradient and color stops"),
});

export const gradientGenerator = defineTool({
  meta: {
    id: "color/gradient-generator",
    name: "Gradient Generator",
    description:
      "Free online CSS gradient generator — create linear or radial gradient strings with custom colors, direction, and color stops instantly in your browser. No data is stored. Outputs ready-to-use CSS.",
    category: "color",
    subgroup: "Generation",
    tier: ToolTier.CLIENT,
    keywords: [
      "gradient",
      "css",
      "generate",
      "linear",
      "radial",
      "color",
      "stops",
      "background",
    ],
    examples: [
      {
        title: "Sunset Gradient",
        description: "Generate a warm sunset gradient from orange to purple",
        input: {
          color1: "#FF6B35",
          color2: "#7B2FBE",
          direction: "to right",
          steps: 5,
        },
        output:
          "CSS: linear-gradient(to right, #FF6B35, #DE5C57, #BD4D7A, #9C3E9C, #7B2FBE)\n\nColor Stops:\n  0%: #FF6B35\n  25%: #DE5C57\n  50%: #BD4D7A\n  75%: #9C3E9C\n  100%: #7B2FBE",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const c1 = parseColorInput(input.color1 ?? "#FF0000");
    const c2 = parseColorInput(input.color2 ?? "#0000FF");
    const direction = input.direction ?? "to right";
    const steps = input.steps ?? 5;

    const stops: string[] = [];
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const r = Math.round(c1.r + (c2.r - c1.r) * t);
      const g = Math.round(c1.g + (c2.g - c1.g) * t);
      const b = Math.round(c1.b + (c2.b - c1.b) * t);
      stops.push(rgbToHex({ r, g, b }));
    }

    const gradient =
      direction === "radial"
        ? `radial-gradient(circle, ${stops.join(", ")})`
        : `linear-gradient(${direction}, ${stops.join(", ")})`;

    const lines = [
      `CSS: ${gradient}`,
      ``,
      `Color Stops:`,
      ...stops.map((s, i) => `  ${Math.round((i / (steps - 1)) * 100)}%: ${s}`),
    ];
    return { output: lines.join("\n") };
  },
});
