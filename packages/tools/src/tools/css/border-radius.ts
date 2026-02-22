import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  topLeft: z
    .number()
    .min(0)
    .max(100)
    .default(8)
    .describe("Top-left radius (px or %)"),
  topRight: z
    .number()
    .min(0)
    .max(100)
    .default(8)
    .describe("Top-right radius (px or %)"),
  bottomRight: z
    .number()
    .min(0)
    .max(100)
    .default(8)
    .describe("Bottom-right radius (px or %)"),
  bottomLeft: z
    .number()
    .min(0)
    .max(100)
    .default(8)
    .describe("Bottom-left radius (px or %)"),
  unit: z.enum(["px", "%"]).default("px").describe("Unit for radius values"),
});

const outputSchema = z.object({
  output: z.string().describe("CSS border-radius code"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const { topLeft, topRight, bottomRight, bottomLeft, unit } = input;

  const allSame =
    topLeft === topRight &&
    topRight === bottomRight &&
    bottomRight === bottomLeft;
  const topBottomSame = topLeft === bottomRight && topRight === bottomLeft;

  let shorthand: string;
  if (allSame) {
    shorthand = `${topLeft}${unit}`;
  } else if (topBottomSame) {
    shorthand = `${topLeft}${unit} ${topRight}${unit}`;
  } else {
    shorthand = `${topLeft}${unit} ${topRight}${unit} ${bottomRight}${unit} ${bottomLeft}${unit}`;
  }

  const lines = [
    `/* Border Radius */`,
    `.rounded {`,
    `  -webkit-border-radius: ${shorthand};`,
    `  -moz-border-radius: ${shorthand};`,
    `  border-radius: ${shorthand};`,
    ``,
    `  /* Individual corners */`,
    `  border-top-left-radius: ${topLeft}${unit};`,
    `  border-top-right-radius: ${topRight}${unit};`,
    `  border-bottom-right-radius: ${bottomRight}${unit};`,
    `  border-bottom-left-radius: ${bottomLeft}${unit};`,
    `}`,
  ];

  return { output: lines.join("\n") };
}

export const cssBorderRadius = defineTool({
  meta: {
    id: "css/border-radius",
    name: "CSS Border Radius Generator",
    description:
      "Free online CSS border-radius generator — create rounded corners with per-corner control instantly in your browser. No data is stored. Generates shorthand and individual corner properties with vendor prefixes.",
    category: "css",
    tier: ToolTier.CLIENT,
    keywords: [
      "css",
      "border-radius",
      "rounded",
      "corners",
      "generator",
      "pill",
      "circle",
    ],
    examples: [
      {
        title: "Pill-shaped button",
        description:
          "Generate CSS for a fully-rounded pill shape using 50% radius",
        input: {
          topLeft: 50,
          topRight: 50,
          bottomRight: 50,
          bottomLeft: 50,
          unit: "%",
        },
        output:
          '{"output":"/* Border Radius */\\n.rounded {\\n  -webkit-border-radius: 50%;\\n  -moz-border-radius: 50%;\\n  border-radius: 50%;\\n\\n  /* Individual corners */\\n  border-top-left-radius: 50%;\\n  border-top-right-radius: 50%;\\n  border-bottom-right-radius: 50%;\\n  border-bottom-left-radius: 50%;\\n}"}',
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
