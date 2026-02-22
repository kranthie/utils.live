import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  pattern: z
    .enum([
      "dots",
      "lines",
      "grid",
      "diagonal",
      "crosshatch",
      "chevron",
      "zigzag",
      "hexagons",
    ])
    .default("dots")
    .describe("Pattern type"),
  width: z.number().min(100).max(1000).default(400).describe("SVG width"),
  height: z.number().min(100).max(1000).default(400).describe("SVG height"),
  tileSize: z
    .number()
    .min(5)
    .max(100)
    .default(20)
    .describe("Pattern tile size"),
  color: z.string().default("#333333").describe("Pattern color"),
  backgroundColor: z.string().default("#ffffff").describe("Background color"),
  opacity: z.number().min(0).max(1).default(0.5).describe("Pattern opacity"),
});

const outputSchema = z.object({
  output: z.string().describe("SVG with repeating pattern"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const { pattern, width, height, tileSize, color, backgroundColor, opacity } =
    input;
  const s = tileSize;

  let patternContent: string;
  let patternSize = `width="${s}" height="${s}"`;

  switch (pattern) {
    case "dots":
      patternContent = `<circle cx="${s / 2}" cy="${s / 2}" r="${s / 6}" fill="${color}"/>`;
      break;
    case "lines":
      patternContent = `<line x1="0" y1="${s}" x2="${s}" y2="${s}" stroke="${color}" stroke-width="1"/>`;
      break;
    case "grid":
      patternContent = `<line x1="${s}" y1="0" x2="${s}" y2="${s}" stroke="${color}" stroke-width="0.5"/><line x1="0" y1="${s}" x2="${s}" y2="${s}" stroke="${color}" stroke-width="0.5"/>`;
      break;
    case "diagonal":
      patternContent = `<line x1="0" y1="${s}" x2="${s}" y2="0" stroke="${color}" stroke-width="1"/>`;
      break;
    case "crosshatch":
      patternContent = `<line x1="0" y1="0" x2="${s}" y2="${s}" stroke="${color}" stroke-width="0.5"/><line x1="${s}" y1="0" x2="0" y2="${s}" stroke="${color}" stroke-width="0.5"/>`;
      break;
    case "chevron":
      patternContent = `<polyline points="0,${s * 0.75} ${s / 2},${s * 0.25} ${s},${s * 0.75}" fill="none" stroke="${color}" stroke-width="1.5"/>`;
      break;
    case "zigzag":
      patternContent = `<polyline points="0,${s * 0.5} ${s / 4},${s * 0.25} ${s / 2},${s * 0.5} ${(s * 3) / 4},${s * 0.75} ${s},${s * 0.5}" fill="none" stroke="${color}" stroke-width="1"/>`;
      break;
    case "hexagons": {
      const r = s / 2;
      const h = (r * Math.sqrt(3)) / 2;
      patternSize = `width="${s * 1.5}" height="${h * 2}"`;
      const hex = (cx: number, cy: number): string => {
        const pts: string[] = [];
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 6;
          pts.push(
            `${(cx + r * 0.45 * Math.cos(angle)).toFixed(1)},${(cy + r * 0.45 * Math.sin(angle)).toFixed(1)}`
          );
        }
        return `<polygon points="${pts.join(" ")}" fill="none" stroke="${color}" stroke-width="1"/>`;
      };
      patternContent =
        hex(r, h) + hex(r * 1.5 + r / 2, 0) + hex(r * 1.5 + r / 2, h * 2);
      break;
    }
    default:
      patternContent = `<circle cx="${s / 2}" cy="${s / 2}" r="${s / 6}" fill="${color}"/>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <pattern id="pattern" ${patternSize} patternUnits="userSpaceOnUse">
      ${patternContent}
    </pattern>
  </defs>
  <rect width="${width}" height="${height}" fill="${backgroundColor}"/>
  <rect width="${width}" height="${height}" fill="url(#pattern)" opacity="${opacity}"/>
</svg>`;

  return { output: svg };
}

export const svgPatternGenerator = defineTool({
  meta: {
    id: "svg/svg-pattern-generator",
    name: "SVG Pattern Generator",
    description:
      "Free online SVG pattern generator — create repeating patterns with dots, lines, grids, diagonals, crosshatch, chevrons, zigzags, and hexagons instantly in your browser. No data is stored. Supports custom tile size, colors, and opacity.",
    category: "svg",
    subgroup: "SVG Generators",
    tier: ToolTier.CLIENT,
    keywords: [
      "svg",
      "pattern",
      "repeating",
      "texture",
      "background",
      "tile",
      "seamless",
      "wallpaper",
      "css",
    ],
    examples: [
      {
        title: "Dot grid pattern on white background",
        description: "Generate a repeating dots pattern",
        input: {
          pattern: "dots",
          width: 400,
          height: 400,
          tileSize: 20,
          color: "#333333",
          backgroundColor: "#ffffff",
          opacity: 0.5,
        },
        output:
          '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">...</svg>',
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
