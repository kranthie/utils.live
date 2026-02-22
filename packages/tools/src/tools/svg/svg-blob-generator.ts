import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  size: z.number().min(50).max(1000).default(300).describe("Blob size"),
  complexity: z
    .number()
    .min(3)
    .max(20)
    .default(6)
    .describe("Number of points (complexity)"),
  color: z.string().default("#4e79a7").describe("Blob color"),
  seed: z.number().default(42).describe("Random seed for reproducible shapes"),
  stroke: z.boolean().default(false).describe("Show stroke outline"),
  strokeWidth: z.number().min(0.5).max(10).default(2).describe("Stroke width"),
  strokeColor: z.string().default("#2c5282").describe("Stroke color"),
});

const outputSchema = z.object({
  output: z.string().describe("Blob SVG"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function execute(input: Input): Output {
  const { size, complexity, color, seed, stroke, strokeWidth, strokeColor } =
    input;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 10;
  const random = seededRandom(seed);

  // Generate points on a circle with random radius variations
  const points: Array<[number, number]> = [];
  for (let i = 0; i < complexity; i++) {
    const angle = (i / complexity) * 2 * Math.PI;
    const r = radius * (0.7 + random() * 0.3);
    points.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }

  // Create smooth blob using cubic bezier curves
  let path = `M ${points[0]![0].toFixed(1)} ${points[0]![1].toFixed(1)}`;

  for (let i = 0; i < points.length; i++) {
    const p0 = points[(i - 1 + points.length) % points.length]!;
    const p1 = points[i]!;
    const p2 = points[(i + 1) % points.length]!;
    const p3 = points[(i + 2) % points.length]!;

    // Catmull-Rom to cubic bezier conversion
    const tension = 0.3;
    const cp1x = p1[0] + (p2[0] - p0[0]) * tension;
    const cp1y = p1[1] + (p2[1] - p0[1]) * tension;
    const cp2x = p2[0] - (p3[0] - p1[0]) * tension;
    const cp2y = p2[1] - (p3[1] - p1[1]) * tension;

    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }

  path += " Z";

  const strokeAttr = stroke
    ? `stroke="${strokeColor}" stroke-width="${strokeWidth}"`
    : `stroke="none"`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <path d="${path}" fill="${color}" ${strokeAttr}/>
</svg>`;

  return { output: svg };
}

export const svgBlobGenerator = defineTool({
  meta: {
    id: "svg/svg-blob-generator",
    name: "SVG Blob Generator",
    description:
      "Free online SVG blob generator — create organic, smooth blob shapes with Catmull-Rom spline curves instantly in your browser. No data is stored. Supports configurable complexity, colors, stroke, and reproducible seeds.",
    category: "svg",
    subgroup: "SVG Generators",
    tier: ToolTier.CLIENT,
    keywords: [
      "svg",
      "blob",
      "shape",
      "organic",
      "random",
      "smooth",
      "catmull-rom",
      "ui",
      "decoration",
    ],
    examples: [
      {
        title: "Smooth 6-point organic blob",
        description: "Generate an organic blue blob shape",
        input: {
          size: 300,
          complexity: 6,
          color: "#4e79a7",
          seed: 42,
          stroke: false,
          strokeWidth: 2,
          strokeColor: "#2c5282",
        },
        output:
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">...</svg>',
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
