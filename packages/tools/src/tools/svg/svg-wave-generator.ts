import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  width: z.number().min(100).max(2000).default(1200).describe("Wave width"),
  height: z.number().min(50).max(500).default(150).describe("Wave height"),
  waves: z.number().min(1).max(10).default(3).describe("Number of wave layers"),
  color: z.string().default("#4e79a7").describe("Base color (hex)"),
  amplitude: z.number().min(5).max(100).default(30).describe("Wave amplitude"),
  frequency: z
    .number()
    .min(1)
    .max(10)
    .default(2)
    .describe("Number of wave cycles"),
  flip: z.boolean().default(false).describe("Flip wave vertically"),
});

const outputSchema = z.object({
  output: z.string().describe("Wave SVG"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function hexToRgb(hex: string): [number, number, number] {
  hex = hex.replace("#", "");
  if (hex.length === 3) {
    const r = hex.charAt(0);
    const g = hex.charAt(1);
    const b = hex.charAt(2);
    hex = r + r + g + g + b + b;
  }
  return [
    parseInt(hex.substring(0, 2), 16),
    parseInt(hex.substring(2, 4), 16),
    parseInt(hex.substring(4, 6), 16),
  ];
}

function execute(input: Input): Output {
  const { width, height, waves, color, amplitude, frequency, flip } = input;
  const [r, g, b] = hexToRgb(color);

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`;

  for (let w = 0; w < waves; w++) {
    const opacity = 1 - w * 0.2;
    const yOffset = height * 0.3 + w * 15;
    const waveAmplitude = amplitude - w * 5;
    const phase = w * 0.5;

    let path = `M 0 ${height}`;

    // Generate wave path
    const points = 100;
    for (let i = 0; i <= points; i++) {
      const x = (i / points) * width;
      const rawY =
        Math.sin((i / points) * frequency * 2 * Math.PI + phase) *
        waveAmplitude;
      const y = flip ? height - yOffset + rawY : yOffset + rawY;
      path += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }

    path += flip
      ? ` L ${width} 0 L 0 0 Z`
      : ` L ${width} ${height} L 0 ${height} Z`;

    svg += `<path d="${path}" fill="rgba(${r},${g},${b},${opacity.toFixed(2)})"/>`;
  }

  svg += "</svg>";
  return { output: svg };
}

export const svgWaveGenerator = defineTool({
  meta: {
    id: "svg/svg-wave-generator",
    name: "SVG Wave Generator",
    description:
      "Free online SVG wave generator — create layered wave patterns for section backgrounds and page dividers instantly in your browser. No data is stored. Supports multiple wave layers, custom colors, amplitude, frequency, and vertical flipping.",
    category: "svg",
    subgroup: "SVG Generators",
    tier: ToolTier.CLIENT,
    keywords: [
      "svg",
      "wave",
      "pattern",
      "decorative",
      "divider",
      "section",
      "hero",
      "landing-page",
      "layered",
      "animated",
    ],
    examples: [
      {
        title: "Three-layer blue wave section background",
        description: "Generate a layered blue wave pattern",
        input: {
          width: 1200,
          height: 150,
          waves: 3,
          color: "#3498DB",
          amplitude: 30,
          frequency: 2,
          flip: false,
        },
        output:
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 150" width="1200" height="150">...</svg>',
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
