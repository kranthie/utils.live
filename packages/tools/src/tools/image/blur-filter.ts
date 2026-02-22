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
  radius: z
    .number()
    .min(1)
    .max(50)
    .default(5)
    .describe("Blur radius in pixels"),
});
const outputSchema = z.object({
  output: z.string().describe("Blurred image as data URL"),
});

async function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): Promise<z.infer<typeof outputSchema>> {
  if (!input.input.trim()) throw new Error("Input cannot be empty");

  const dataUrl = ensureDataUrl(input.input);
  const radius = options?.radius ?? 5;

  if (!isCanvasAvailable()) {
    return { output: dataUrl };
  }

  const { image, width, height } = await loadImage(dataUrl);
  const canvas = createCanvas(width, height);
  const ctx = getContext(canvas);
  (ctx as CanvasRenderingContext2D).filter = `blur(${radius}px)`;
  ctx.drawImage(image as CanvasImageSource, 0, 0);

  const output = await canvasToDataUrl(canvas, "image/png");
  return { output };
}

export const blurFilter = defineTool({
  meta: {
    id: "image/blur-filter",
    name: "Blur Filter",
    description:
      "Free online image blur tool — apply adjustable Gaussian blur to images instantly in your browser. No data is stored. Supports radius from 1 to 50 pixels on PNG, JPEG, and WebP images.",
    category: "image",
    subgroup: "Effects",
    tier: ToolTier.CLIENT,
    keywords: ["image", "blur", "gaussian", "filter", "smooth"],
    examples: [
      {
        title: "Gaussian Blur",
        description: "Apply a 5px blur to a photo",
        input: "data:image/png;base64,iVBORw0KGgo... (image data URL)",
        output: "data:image/png;base64,... (blurred image data URL)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
