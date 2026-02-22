import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  offsetX: z.number().default(4).describe("Horizontal offset (px)"),
  offsetY: z.number().default(4).describe("Vertical offset (px)"),
  blur: z.number().min(0).default(10).describe("Blur radius (px)"),
  spread: z.number().default(0).describe("Spread radius (px)"),
  color: z.string().default("rgba(0, 0, 0, 0.25)").describe("Shadow color"),
  inset: z.boolean().default(false).describe("Inset shadow"),
});

const outputSchema = z.object({
  output: z.string().describe("CSS box-shadow code"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const { offsetX, offsetY, blur, spread, color, inset } = input;

  const insetStr = inset ? "inset " : "";
  const shadow = `${insetStr}${offsetX}px ${offsetY}px ${blur}px ${spread}px ${color}`;

  const lines = [
    `/* Box Shadow */`,
    `.shadow {`,
    `  -webkit-box-shadow: ${shadow};`,
    `  -moz-box-shadow: ${shadow};`,
    `  box-shadow: ${shadow};`,
    `}`,
  ];

  return { output: lines.join("\n") };
}

export const cssBoxShadow = defineTool({
  meta: {
    id: "css/box-shadow",
    name: "CSS Box Shadow Generator",
    description:
      "Free online CSS box-shadow generator — create drop shadows and inset shadows with customizable offset, blur, spread, and color instantly in your browser. No data is stored. Generates standard and vendor-prefixed properties.",
    category: "css",
    tier: ToolTier.CLIENT,
    keywords: [
      "css",
      "box-shadow",
      "shadow",
      "generator",
      "drop shadow",
      "elevation",
      "card",
    ],
    examples: [
      {
        title: "Subtle card shadow",
        description: "Generate a soft drop shadow for a card component",
        input: {
          offsetX: 0,
          offsetY: 2,
          blur: 8,
          spread: 0,
          color: "rgba(0, 0, 0, 0.15)",
          inset: false,
        },
        output:
          '{"output":"/* Box Shadow */\\n.shadow {\\n  -webkit-box-shadow: 0px 2px 8px 0px rgba(0, 0, 0, 0.15);\\n  -moz-box-shadow: 0px 2px 8px 0px rgba(0, 0, 0, 0.15);\\n  box-shadow: 0px 2px 8px 0px rgba(0, 0, 0, 0.15);\\n}"}',
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
