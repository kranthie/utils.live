import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import {
  isCanvasAvailable,
  ensureDataUrl,
  loadImage,
  createCanvas,
  getContext,
  canvasToDataUrl,
} from "./canvas-utils";

const inputSchema = z.object({
  input: z.string().describe("Image data as base64 or data URL"),
});
const optionsSchema = z.object({
  quality: z
    .number()
    .min(0.1)
    .max(1)
    .default(0.7)
    .describe("Compression quality (0.1-1)"),
  maxWidth: z
    .number()
    .min(1)
    .max(8192)
    .optional()
    .describe("Max width (downscale if larger)"),
  format: z.enum(["jpeg", "webp"]).default("jpeg").describe("Output format"),
});
const outputSchema = z.object({
  output: z.string().describe("Compressed image as data URL"),
});

async function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): Promise<z.infer<typeof outputSchema>> {
  if (!input.input.trim()) throw new Error("Input cannot be empty");

  const dataUrl = ensureDataUrl(input.input);
  const quality = options?.quality ?? 0.7;
  const maxWidth = options?.maxWidth;
  const format = options?.format ?? "jpeg";

  if (!isCanvasAvailable()) {
    return { output: dataUrl };
  }

  const { image, width, height } = await loadImage(dataUrl);

  let targetW = width;
  let targetH = height;

  if (maxWidth && width > maxWidth) {
    const ratio = maxWidth / width;
    targetW = maxWidth;
    targetH = Math.round(height * ratio);
  }

  const canvas = createCanvas(targetW, targetH);
  const ctx = getContext(canvas);

  // Fill white background for JPEG (no transparency support)
  if (format === "jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, targetW, targetH);
  }

  ctx.drawImage(image as CanvasImageSource, 0, 0, targetW, targetH);

  const mimeType = `image/${format}`;
  const output = await canvasToDataUrl(canvas, mimeType, quality);
  return { output };
}

export const imageCompressor = defineTool({
  meta: {
    id: "image/image-compressor",
    name: "Image Compressor",
    description:
      "Free online image compressor — reduce JPEG file size with adjustable quality from 1 to 100 instantly in your browser. No data is stored. Outputs compressed JPEG with size comparison.",
    category: "image",
    subgroup: "Editing",
    tier: ToolTier.CLIENT,
    keywords: ["image", "compress", "optimize", "reduce"],
    examples: [
      {
        title: "Compress for Web",
        description:
          "Compress an image to 70% JPEG quality for faster web loading",
        input: "data:image/png;base64,iVBORw0KGgo... (image data URL)",
        output: "data:image/jpeg;base64,... (compressed JPEG data URL)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
