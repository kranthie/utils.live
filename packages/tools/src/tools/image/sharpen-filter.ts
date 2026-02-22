import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import {
  isCanvasAvailable,
  ensureDataUrl,
  loadImageToCanvas,
  createCanvas,
  getContext,
  canvasToDataUrl,
} from "./canvas-utils";

const inputSchema = z.object({
  input: z.string().describe("Image data as base64 or data URL"),
});
const optionsSchema = z.object({
  amount: z.number().min(0).max(10).default(1).describe("Sharpen amount"),
});
const outputSchema = z.object({
  output: z.string().describe("Sharpened image as data URL"),
});

/**
 * Apply convolution kernel to image data.
 */
function applyConvolution(
  srcData: Uint8ClampedArray,
  width: number,
  height: number,
  kernel: number[],
  kernelSize: number
): Uint8ClampedArray {
  const dst = new Uint8ClampedArray(srcData.length);
  const half = Math.floor(kernelSize / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0,
        g = 0,
        b = 0;

      for (let ky = 0; ky < kernelSize; ky++) {
        for (let kx = 0; kx < kernelSize; kx++) {
          const px = Math.min(width - 1, Math.max(0, x + kx - half));
          const py = Math.min(height - 1, Math.max(0, y + ky - half));
          const idx = (py * width + px) * 4;
          const weight = kernel[ky * kernelSize + kx]!;
          r += srcData[idx]! * weight;
          g += srcData[idx + 1]! * weight;
          b += srcData[idx + 2]! * weight;
        }
      }

      const dstIdx = (y * width + x) * 4;
      dst[dstIdx] = Math.min(255, Math.max(0, Math.round(r)));
      dst[dstIdx + 1] = Math.min(255, Math.max(0, Math.round(g)));
      dst[dstIdx + 2] = Math.min(255, Math.max(0, Math.round(b)));
      dst[dstIdx + 3] = srcData[dstIdx + 3]!; // preserve alpha
    }
  }

  return dst;
}

async function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): Promise<z.infer<typeof outputSchema>> {
  if (!input.input.trim()) throw new Error("Input cannot be empty");

  const dataUrl = ensureDataUrl(input.input);
  const amount = options?.amount ?? 1;

  if (!isCanvasAvailable()) {
    return { output: dataUrl };
  }

  const { ctx, width, height } = await loadImageToCanvas(dataUrl);
  const imageData = ctx.getImageData(0, 0, width, height);

  // Unsharp mask kernel scaled by amount
  // Center value increases with amount for stronger sharpening
  const center = 1 + 4 * amount;
  const edge = -amount;
  const kernel = [0, edge, 0, edge, center, edge, 0, edge, 0];

  const sharpened = applyConvolution(imageData.data, width, height, kernel, 3);

  const outCanvas = createCanvas(width, height);
  const outCtx = getContext(outCanvas);
  const outData = outCtx.createImageData(width, height);
  outData.data.set(sharpened);
  outCtx.putImageData(outData, 0, 0);

  const output = await canvasToDataUrl(outCanvas, "image/png");
  return { output };
}

export const sharpenFilter = defineTool({
  meta: {
    id: "image/sharpen-filter",
    name: "Sharpen Filter",
    description:
      "Free online image sharpener — enhance image detail and clarity with adjustable sharpening amount instantly in your browser. No data is stored. Uses unsharp mask algorithm for natural-looking results.",
    category: "image",
    subgroup: "Effects",
    tier: ToolTier.CLIENT,
    keywords: ["image", "sharpen", "filter", "detail", "crisp"],
    examples: [
      {
        title: "Sharpen Image",
        description: "Apply sharpening filter to enhance image details",
        input: { input: "data:image/png;base64,iVBORw0KGgo=" },
        output: "Sharpened image as data URL",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
