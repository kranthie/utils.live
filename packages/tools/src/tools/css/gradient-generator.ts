import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  type: z
    .enum(["linear", "radial", "conic"])
    .default("linear")
    .describe("Gradient type"),
  direction: z
    .string()
    .default("to right")
    .describe(
      "Gradient direction (e.g., 'to right', '45deg', 'circle at center')"
    ),
  colors: z
    .string()
    .default("#667eea, #764ba2")
    .describe("Comma-separated color stops (e.g., '#fff 0%, #000 100%')"),
  repeating: z.boolean().default(false).describe("Make the gradient repeating"),
});

const outputSchema = z.object({
  output: z.string().describe("CSS gradient code"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const { type, direction, colors, repeating } = input;

  const colorStops = colors
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
  if (colorStops.length < 2) {
    throw new Error("At least 2 color stops are required");
  }

  const prefix = repeating ? "repeating-" : "";
  let gradient: string;

  switch (type) {
    case "linear":
      gradient = `${prefix}linear-gradient(${direction}, ${colorStops.join(", ")})`;
      break;
    case "radial":
      gradient = `${prefix}radial-gradient(${direction}, ${colorStops.join(", ")})`;
      break;
    case "conic":
      gradient = `${prefix}conic-gradient(from ${direction}, ${colorStops.join(", ")})`;
      break;
  }

  const lines = [
    `/* Gradient */`,
    `.gradient {`,
    `  background: ${colorStops[0]};  /* Fallback */`,
    `  background: ${gradient};`,
    `  background: -webkit-${gradient};`,
    `}`,
  ];

  return { output: lines.join("\n") };
}

export const cssGradientGenerator = defineTool({
  meta: {
    id: "css/gradient-generator",
    name: "CSS Gradient Generator",
    description:
      "Free online CSS gradient generator — create linear, radial, and conic gradients with custom color stops instantly in your browser. No data is stored. Supports repeating gradients and generates fallback and vendor-prefixed properties.",
    category: "css",
    tier: ToolTier.CLIENT,
    keywords: [
      "css",
      "gradient",
      "generator",
      "linear",
      "radial",
      "conic",
      "background",
    ],
    examples: [
      {
        title: "Sunset gradient background",
        description:
          "Generate a warm 3-color linear gradient from left to right",
        input: {
          type: "linear",
          direction: "to right",
          colors: "#ff6b6b, #feca57, #48dbfb",
          repeating: false,
        },
        output:
          '{"output":"/* Gradient */\\n.gradient {\\n  background: #ff6b6b;  /* Fallback */\\n  background: linear-gradient(to right, #ff6b6b, #feca57, #48dbfb);\\n  background: -webkit-linear-gradient(to right, #ff6b6b, #feca57, #48dbfb);\\n}"}',
      },
    ],
    ui: {
      outputRenderer: "code",
      outputLanguage: "css",
    },
  },
  inputSchema,
  outputSchema,
  execute,
});
