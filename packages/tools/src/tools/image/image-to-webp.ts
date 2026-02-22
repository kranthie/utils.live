import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import {
  isCanvasAvailable,
  ensureDataUrl,
  loadImageToCanvas,
  canvasToDataUrl,
} from "./canvas-utils";

const inputSchema = z.object({
  input: z.string().describe("Image data as base64 or data URL"),
});

const optionsSchema = z.object({
  quality: z.number().min(0).max(1).default(0.8).describe("WebP quality (0-1)"),
});

const outputSchema = z.object({
  output: z.string().describe("WebP image as data URL"),
});

async function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): Promise<z.infer<typeof outputSchema>> {
  if (!input.input.trim()) throw new Error("Input cannot be empty");

  const dataUrl = ensureDataUrl(input.input);
  const quality = options?.quality ?? 0.8;

  if (!isCanvasAvailable()) {
    return { output: dataUrl };
  }

  const { canvas } = await loadImageToCanvas(dataUrl);
  const output = await canvasToDataUrl(canvas, "image/webp", quality);
  return { output };
}

export const imageToWebp = defineTool({
  meta: {
    id: "image/image-to-webp",
    name: "Image to WebP",
    description:
      "Free online image to WebP converter — convert PNG and JPEG images to WebP format with adjustable quality instantly in your browser. No data is stored. Typically reduces file size by 25-35%.",
    category: "image",
    subgroup: "Conversion",
    tier: ToolTier.CLIENT,
    keywords: ["image", "webp", "convert", "optimize"],
    examples: [
      {
        title: "Convert Image to WebP",
        description: "Convert an image to WebP format for smaller file sizes",
        input: { input: "data:image/png;base64,iVBORw0KGgo=" },
        output: "data:image/webp;base64,...",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
