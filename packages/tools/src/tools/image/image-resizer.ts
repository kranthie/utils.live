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
  width: z.number().min(1).max(8192).describe("Target width in pixels"),
  height: z.number().min(1).max(8192).describe("Target height in pixels"),
  maintainAspectRatio: z
    .boolean()
    .default(true)
    .describe("Maintain aspect ratio"),
});
const outputSchema = z.object({
  output: z.string().describe("Resized image as data URL"),
});

async function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): Promise<z.infer<typeof outputSchema>> {
  if (!input.input.trim()) throw new Error("Input cannot be empty");

  const dataUrl = ensureDataUrl(input.input);
  const targetW = options?.width ?? 100;
  const targetH = options?.height ?? 100;
  const keepAspect = options?.maintainAspectRatio ?? true;

  if (!isCanvasAvailable()) {
    return { output: dataUrl };
  }

  const { image, width: srcW, height: srcH } = await loadImage(dataUrl);

  let finalW = targetW;
  let finalH = targetH;

  if (keepAspect) {
    const ratio = Math.min(targetW / srcW, targetH / srcH);
    finalW = Math.round(srcW * ratio);
    finalH = Math.round(srcH * ratio);
  }

  const canvas = createCanvas(finalW, finalH);
  const ctx = getContext(canvas);
  ctx.drawImage(image as CanvasImageSource, 0, 0, finalW, finalH);

  const output = await canvasToDataUrl(canvas, "image/png");
  return { output };
}

export const imageResizer = defineTool({
  meta: {
    id: "image/image-resizer",
    name: "Image Resizer",
    description:
      "Free online image resizer — resize images to exact pixel dimensions or by scale percentage instantly in your browser. No data is stored. Supports lock aspect ratio and custom width/height.",
    category: "image",
    subgroup: "Editing",
    tier: ToolTier.CLIENT,
    keywords: ["image", "resize", "scale", "dimensions"],
    examples: [
      {
        title: "Resize for Social Media",
        description:
          "Resize an image to 800x600 while maintaining aspect ratio",
        input: "data:image/png;base64,iVBORw0KGgo... (image data URL)",
        output: "data:image/png;base64,... (resized image data URL)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
