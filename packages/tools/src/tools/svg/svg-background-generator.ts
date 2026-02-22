import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  style: z
    .enum(["gradient", "noise", "circles", "triangles", "topography", "waves"])
    .default("gradient")
    .describe("Background style"),
  width: z
    .number()
    .min(100)
    .max(2000)
    .default(800)
    .describe("Background width"),
  height: z
    .number()
    .min(100)
    .max(2000)
    .default(600)
    .describe("Background height"),
  color1: z.string().default("#667eea").describe("Primary color"),
  color2: z.string().default("#764ba2").describe("Secondary color"),
  seed: z
    .number()
    .default(42)
    .describe("Random seed for reproducible patterns"),
  opacity: z.number().min(0).max(1).default(0.5).describe("Pattern opacity"),
});

const outputSchema = z.object({
  output: z.string().describe("Background SVG"),
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
  const { style, width, height, color1, color2, seed, opacity } = input;
  const random = seededRandom(seed);

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`;
  svg += `<defs>`;
  svg += `<linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">`;
  svg += `<stop offset="0%" stop-color="${color1}"/>`;
  svg += `<stop offset="100%" stop-color="${color2}"/>`;
  svg += `</linearGradient>`;
  svg += `</defs>`;
  svg += `<rect width="${width}" height="${height}" fill="url(#bg-grad)"/>`;

  switch (style) {
    case "circles":
      for (let i = 0; i < 30; i++) {
        const cx = random() * width;
        const cy = random() * height;
        const r = 10 + random() * 80;
        const o = opacity * (0.3 + random() * 0.7);
        svg += `<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${r.toFixed(0)}" fill="rgba(255,255,255,${o.toFixed(2)})" />`;
      }
      break;
    case "triangles":
      for (let i = 0; i < 20; i++) {
        const x = random() * width;
        const y = random() * height;
        const s = 20 + random() * 60;
        const o = opacity * (0.2 + random() * 0.5);
        const rotation = random() * 360;
        svg += `<polygon points="${x},${y - s} ${x - s * 0.866},${y + s * 0.5} ${x + s * 0.866},${y + s * 0.5}" fill="rgba(255,255,255,${o.toFixed(2)})" transform="rotate(${rotation.toFixed(0)} ${x.toFixed(0)} ${y.toFixed(0)})"/>`;
      }
      break;
    case "topography":
      for (let i = 0; i < 15; i++) {
        const cx = random() * width;
        const cy = random() * height;
        for (let j = 3; j > 0; j--) {
          const r = j * (15 + random() * 30);
          svg += `<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${r.toFixed(0)}" fill="none" stroke="rgba(255,255,255,${(opacity * 0.3).toFixed(2)})" stroke-width="1"/>`;
        }
      }
      break;
    case "waves":
      for (let i = 0; i < 8; i++) {
        const yOffset = (height / 8) * i + random() * 40;
        let path = `M 0 ${yOffset}`;
        for (let x = 0; x <= width; x += 50) {
          const y = yOffset + Math.sin(x * 0.01 + i) * (20 + random() * 30);
          path += ` L ${x} ${y.toFixed(1)}`;
        }
        svg += `<path d="${path}" fill="none" stroke="rgba(255,255,255,${(opacity * 0.3).toFixed(2)})" stroke-width="1.5"/>`;
      }
      break;
    case "noise":
      for (let i = 0; i < 200; i++) {
        const x = random() * width;
        const y = random() * height;
        const s = 1 + random() * 3;
        const o = opacity * random() * 0.5;
        svg += `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${s.toFixed(1)}" height="${s.toFixed(1)}" fill="rgba(255,255,255,${o.toFixed(2)})"/>`;
      }
      break;
    default:
      // Just gradient
      break;
  }

  svg += "</svg>";
  return { output: svg };
}

export const svgBackgroundGenerator = defineTool({
  meta: {
    id: "svg/svg-background-generator",
    name: "SVG Background Generator",
    description:
      "Free online SVG background generator — create decorative gradient backgrounds with circles, triangles, topography, waves, and noise patterns instantly in your browser. No data is stored. Supports custom colors, sizes, opacity, and reproducible seeds.",
    category: "svg",
    subgroup: "SVG Generators",
    tier: ToolTier.CLIENT,
    keywords: [
      "svg",
      "background",
      "pattern",
      "gradient",
      "decorative",
      "wallpaper",
      "hero",
      "landing-page",
      "noise",
      "topography",
    ],
    examples: [
      {
        title: "Floating circles over purple gradient",
        description: "Generate a gradient background with floating circles",
        input: {
          style: "circles",
          width: 800,
          height: 600,
          color1: "#667eea",
          color2: "#764ba2",
          seed: 42,
          opacity: 0.5,
        },
        output:
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">...</svg>',
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
