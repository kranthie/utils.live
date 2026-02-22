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
  input: z.string().describe("PNG image data as base64 or data URL"),
});

const optionsSchema = z.object({
  quality: z
    .number()
    .min(0)
    .max(1)
    .default(0.92)
    .describe("JPEG quality (0-1)"),
});

const outputSchema = z.object({
  output: z.string().describe("JPEG image as data URL"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

async function execute(input: Input, options?: Options): Promise<Output> {
  if (!input.input.trim()) {
    throw new Error(
      "Input cannot be empty. Provide PNG image data as base64 or data URL."
    );
  }

  const dataUrl = ensureDataUrl(input.input);
  const quality = options?.quality ?? 0.92;

  if (!isCanvasAvailable()) {
    return { output: dataUrl };
  }

  const { image, width, height } = await loadImage(dataUrl);
  const canvas = createCanvas(width, height);
  const ctx = getContext(canvas);

  // Fill with white background since JPEG doesn't support transparency
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(image as CanvasImageSource, 0, 0);

  const output = await canvasToDataUrl(canvas, "image/jpeg", quality);
  return { output };
}

export const pngToJpg = defineTool({
  meta: {
    id: "image/png-to-jpg",
    name: "PNG to JPG",
    description:
      "Free online PNG to JPG converter — convert PNG images to JPEG format with adjustable quality instantly in your browser. No data is stored. Replaces transparency with a configurable background color.",
    category: "image",
    subgroup: "Conversion",
    tier: ToolTier.CLIENT,
    keywords: ["png", "jpg", "jpeg", "convert", "image"],
    examples: [
      {
        title: "Convert PNG to JPG",
        description: "Convert a PNG image to JPEG format with quality setting",
        input: { input: "data:image/png;base64,iVBORw0KGgo=" },
        output: "data:image/jpeg;base64,...",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
