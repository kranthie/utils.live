import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import {
  isCanvasAvailable,
  loadImage,
  createCanvas,
  getContext,
  canvasToDataUrl,
} from "../image/canvas-utils";

const inputSchema = z.object({ input: z.string().describe("SVG source code") });
const optionsSchema = z.object({
  scale: z
    .number()
    .min(0.1)
    .max(10)
    .default(1)
    .describe("Scale factor for output"),
});
const outputSchema = z.object({
  output: z.string().describe("PNG image as data URL"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Extract width/height from SVG string.
 * Falls back to viewBox dimensions, then defaults to 300x150.
 */
function parseSvgDimensions(svg: string): { width: number; height: number } {
  const widthMatch = svg.match(/\bwidth=["'](\d+(?:\.\d+)?)/);
  const heightMatch = svg.match(/\bheight=["'](\d+(?:\.\d+)?)/);
  if (widthMatch && heightMatch) {
    return {
      width: parseFloat(widthMatch[1]!),
      height: parseFloat(heightMatch[1]!),
    };
  }
  const viewBoxMatch = svg.match(
    /viewBox=["']\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/
  );
  if (viewBoxMatch) {
    return {
      width: parseFloat(viewBoxMatch[3]!),
      height: parseFloat(viewBoxMatch[4]!),
    };
  }
  return { width: 300, height: 150 };
}

async function execute(input: Input, options?: Options): Promise<Output> {
  if (!input.input.trim()) throw new Error("Input cannot be empty");

  const svgContent = input.input.trim();
  if (!svgContent.includes("<svg")) {
    throw new Error(
      "Input does not appear to be valid SVG. Must contain an <svg> element."
    );
  }

  if (!isCanvasAvailable()) {
    // Graceful fallback for SSR / Node.js environment
    return {
      output: [
        "SVG to PNG conversion requires the browser Canvas API.",
        "This tool runs in the browser (CLIENT tier).",
        "",
        `Input SVG: ${svgContent.length} characters`,
      ].join("\n"),
    };
  }

  const scale = options?.scale ?? 1;
  const { width, height } = parseSvgDimensions(svgContent);
  const scaledWidth = Math.round(width * scale);
  const scaledHeight = Math.round(height * scale);

  // Convert SVG to data URL for loading as an image
  const svgDataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgContent)))}`;

  const { image } = await loadImage(svgDataUrl);
  const canvas = createCanvas(scaledWidth, scaledHeight);
  const ctx = getContext(canvas);
  ctx.drawImage(image as CanvasImageSource, 0, 0, scaledWidth, scaledHeight);

  const output = await canvasToDataUrl(canvas, "image/png");
  return { output };
}

export const svgToPngConverter = defineTool({
  meta: {
    id: "svg/svg-to-png",
    name: "SVG to PNG",
    description:
      "Free online SVG to PNG converter — rasterize SVG vector graphics to PNG format with transparency support instantly in your browser. No data is stored. Supports custom scale factor for high-DPI output.",
    category: "svg",
    subgroup: "SVG Operations",
    tier: ToolTier.CLIENT,
    keywords: [
      "svg",
      "png",
      "convert",
      "rasterize",
      "image",
      "raster",
      "bitmap",
      "transparent",
      "export",
      "download",
      "retina",
    ],
    examples: [
      {
        title: "Rasterize red circle to PNG",
        description: "Rasterize a simple SVG circle to PNG format",
        input:
          '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" fill="#E74C3C"/></svg>',
        output: "data:image/png;base64,iVBORw0KGgo...",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
