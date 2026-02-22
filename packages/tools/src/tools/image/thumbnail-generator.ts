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
  maxWidth: z
    .number()
    .min(16)
    .max(512)
    .default(150)
    .describe("Max thumbnail width"),
  maxHeight: z
    .number()
    .min(16)
    .max(512)
    .default(150)
    .describe("Max thumbnail height"),
  format: z
    .enum(["jpeg", "png", "webp"])
    .default("jpeg")
    .describe("Output format"),
  quality: z.number().min(0.1).max(1).default(0.8).describe("Output quality"),
});
const outputSchema = z.object({
  output: z.string().describe("Thumbnail image as data URL"),
});

async function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): Promise<z.infer<typeof outputSchema>> {
  if (!input.input.trim()) throw new Error("Input cannot be empty");

  const dataUrl = ensureDataUrl(input.input);
  const maxW = options?.maxWidth ?? 150;
  const maxH = options?.maxHeight ?? 150;
  const format = options?.format ?? "jpeg";
  const quality = options?.quality ?? 0.8;

  if (!isCanvasAvailable()) {
    return { output: dataUrl };
  }

  const { image, width, height } = await loadImage(dataUrl);

  // Scale to fit within maxW x maxH while maintaining aspect ratio
  const ratio = Math.min(maxW / width, maxH / height, 1);
  const thumbW = Math.round(width * ratio);
  const thumbH = Math.round(height * ratio);

  const canvas = createCanvas(thumbW, thumbH);
  const ctx = getContext(canvas);

  // Fill white background for JPEG
  if (format === "jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, thumbW, thumbH);
  }

  ctx.drawImage(image as CanvasImageSource, 0, 0, thumbW, thumbH);

  const mimeType = `image/${format}`;
  const output = await canvasToDataUrl(canvas, mimeType, quality);
  return { output };
}

export const thumbnailGenerator = defineTool({
  meta: {
    id: "image/thumbnail-generator",
    name: "Thumbnail Generator",
    description:
      "Free online thumbnail generator — create smaller preview versions of images with max width and height constraints instantly in your browser. No data is stored. Maintains aspect ratio automatically.",
    category: "image",
    subgroup: "Editing",
    tier: ToolTier.CLIENT,
    keywords: ["image", "thumbnail", "small", "preview"],
    examples: [
      {
        title: "Generate Thumbnail",
        description: "Generate a 150x150 thumbnail from an image",
        input: { input: "data:image/png;base64,iVBORw0KGgo=" },
        output: "Thumbnail image as data URL",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
