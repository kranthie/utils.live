import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  style: z
    .enum(["wave", "triangle", "curve", "slant", "zigzag", "arrow", "rounded"])
    .default("wave")
    .describe("Divider style"),
  width: z.number().min(100).max(2000).default(1200).describe("Divider width"),
  height: z.number().min(20).max(300).default(80).describe("Divider height"),
  color: z.string().default("#333333").describe("Divider color"),
  flip: z.boolean().default(false).describe("Flip vertically"),
});

const outputSchema = z.object({
  output: z.string().describe("Section divider SVG"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const { style, width, height, color, flip } = input;

  let path: string;

  switch (style) {
    case "wave":
      path = `M 0 ${height} Q ${width * 0.25} ${height * 0.2}, ${width * 0.5} ${height * 0.5} T ${width} ${height * 0.3} L ${width} ${height} Z`;
      break;
    case "triangle":
      path = `M 0 ${height} L ${width / 2} 0 L ${width} ${height} Z`;
      break;
    case "curve":
      path = `M 0 ${height} C ${width * 0.3} 0, ${width * 0.7} 0, ${width} ${height} Z`;
      break;
    case "slant":
      path = `M 0 ${height} L ${width} 0 L ${width} ${height} Z`;
      break;
    case "zigzag": {
      const teeth = 12;
      const teethWidth = width / teeth;
      let p = `M 0 ${height}`;
      for (let i = 0; i < teeth; i++) {
        const x1 = i * teethWidth + teethWidth / 2;
        const x2 = (i + 1) * teethWidth;
        p += ` L ${x1} ${height * 0.3} L ${x2} ${height}`;
      }
      p += ` L ${width} ${height} Z`;
      path = p;
      break;
    }
    case "arrow":
      path = `M 0 ${height} L ${width / 2} ${height * 0.2} L ${width} ${height} L ${width} ${height} Z`;
      break;
    case "rounded":
      path = `M 0 ${height} Q ${width / 2} ${-height * 0.5}, ${width} ${height} Z`;
      break;
    default:
      path = `M 0 ${height} Q ${width * 0.25} ${height * 0.2}, ${width * 0.5} ${height * 0.5} T ${width} ${height * 0.3} L ${width} ${height} Z`;
  }

  const transform = flip
    ? `transform="scale(1,-1) translate(0,-${height})"`
    : "";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" preserveAspectRatio="none">
  <path d="${path}" fill="${color}" ${transform}/>
</svg>`;

  return { output: svg };
}

export const svgDividerGenerator = defineTool({
  meta: {
    id: "svg/svg-divider-generator",
    name: "SVG Divider Generator",
    description:
      "Free online SVG divider generator — create section dividers with wave, triangle, curve, slant, zigzag, arrow, and rounded styles instantly in your browser. No data is stored. Supports custom colors, sizes, and vertical flipping.",
    category: "svg",
    subgroup: "SVG Generators",
    tier: ToolTier.CLIENT,
    keywords: [
      "svg",
      "divider",
      "section",
      "separator",
      "shape",
      "hero",
      "landing-page",
      "scroll",
      "transition",
    ],
    examples: [
      {
        title: "Wave-style page section divider",
        description: "Generate a wave-shaped section divider",
        input: {
          style: "wave",
          width: 1200,
          height: 80,
          color: "#3498DB",
          flip: false,
        },
        output:
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 80" width="1200" height="80">...</svg>',
      },
      {
        title: "Triangle section divider",
        description: "Generate a triangle section divider",
        input: {
          style: "triangle",
          width: 1200,
          height: 80,
          color: "#E74C3C",
          flip: false,
        },
        output:
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 80" width="1200" height="80">...</svg>',
      },
    ],
    ui: {
      outputRenderer: "html",
    },
  },
  inputSchema,
  outputSchema,
  execute,
});
