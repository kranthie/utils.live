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
  quality: z.number().min(0).max(1).default(0.92).describe("JPEG quality"),
  backgroundColor: z.string().default("#ffffff").describe("Background color"),
});
const outputSchema = z.object({
  output: z.string().describe("JPEG image as data URL"),
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
        "SVG to JPEG conversion requires the browser Canvas API.",
        "This tool runs in the browser (CLIENT tier).",
        "",
        `Input SVG: ${svgContent.length} characters`,
      ].join("\n"),
    };
  }

  const quality = options?.quality ?? 0.92;
  const backgroundColor = options?.backgroundColor ?? "#ffffff";
  const { width, height } = parseSvgDimensions(svgContent);

  // Convert SVG to data URL for loading as an image
  const svgDataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgContent)))}`;

  const { image } = await loadImage(svgDataUrl);
  const canvas = createCanvas(width, height);
  const ctx = getContext(canvas);

  // Fill with background color since JPEG doesn't support transparency
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(image as CanvasImageSource, 0, 0, width, height);

  const output = await canvasToDataUrl(canvas, "image/jpeg", quality);
  return { output };
}

export const svgToJpg = defineTool({
  meta: {
    id: "svg/svg-to-jpg",
    name: "SVG to JPG",
    description:
      "Free online SVG to JPG converter — rasterize SVG vector graphics to JPEG format with configurable quality instantly in your browser. No data is stored. Supports custom background color and JPEG compression quality.",
    category: "svg",
    subgroup: "SVG Operations",
    tier: ToolTier.CLIENT,
    keywords: [
      "svg",
      "jpg",
      "jpeg",
      "convert",
      "rasterize",
      "image",
      "raster",
      "bitmap",
      "export",
      "download",
    ],
    examples: [
      {
        title: "Rasterize green rectangle to JPEG",
        description: "Rasterize an SVG rectangle to JPEG format",
        input:
          '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect width="200" height="100" fill="#2ECC71"/></svg>',
        output: "data:image/jpeg;base64,/9j/4AAQSkZ...",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
