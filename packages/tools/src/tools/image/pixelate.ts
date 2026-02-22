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
  blockSize: z
    .number()
    .min(2)
    .max(100)
    .default(10)
    .describe("Pixel block size"),
});
const outputSchema = z.object({
  output: z.string().describe("Pixelated image as data URL"),
});

async function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): Promise<z.infer<typeof outputSchema>> {
  if (!input.input.trim()) throw new Error("Input cannot be empty");

  const dataUrl = ensureDataUrl(input.input);
  const blockSize = options?.blockSize ?? 10;

  if (!isCanvasAvailable()) {
    return { output: dataUrl };
  }

  const { image, width, height } = await loadImage(dataUrl);

  // Scale down to small size
  const smallW = Math.max(1, Math.ceil(width / blockSize));
  const smallH = Math.max(1, Math.ceil(height / blockSize));

  const smallCanvas = createCanvas(smallW, smallH);
  const smallCtx = getContext(smallCanvas);
  smallCtx.drawImage(image as CanvasImageSource, 0, 0, smallW, smallH);

  // Scale back up without smoothing to get blocky pixels
  const canvas = createCanvas(width, height);
  const ctx = getContext(canvas);
  (ctx as CanvasRenderingContext2D).imageSmoothingEnabled = false;
  ctx.drawImage(smallCanvas as CanvasImageSource, 0, 0, width, height);

  const output = await canvasToDataUrl(canvas, "image/png");
  return { output };
}

export const pixelate = defineTool({
  meta: {
    id: "image/pixelate",
    name: "Pixelate",
    description:
      "Free online pixelate tool — apply a mosaic pixelation effect to images with adjustable block size instantly in your browser. No data is stored. Block sizes from 2 to 100 pixels.",
    category: "image",
    subgroup: "Effects",
    tier: ToolTier.CLIENT,
    keywords: ["image", "pixelate", "mosaic", "censor", "filter"],
    examples: [
      {
        title: "Pixelate an Image",
        description: "Apply a pixelation effect with 10px block size",
        input: { input: "data:image/png;base64,iVBORw0KGgo=" },
        output: "Pixelated image as data URL",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
