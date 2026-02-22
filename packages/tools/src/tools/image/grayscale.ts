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
const outputSchema = z.object({
  output: z.string().describe("Grayscale image as data URL"),
});

async function execute(
  input: z.infer<typeof inputSchema>
): Promise<z.infer<typeof outputSchema>> {
  if (!input.input.trim()) throw new Error("Input cannot be empty");

  const dataUrl = ensureDataUrl(input.input);

  if (!isCanvasAvailable()) {
    return { output: dataUrl };
  }

  const { image, width, height } = await loadImage(dataUrl);
  const canvas = createCanvas(width, height);
  const ctx = getContext(canvas);
  (ctx as CanvasRenderingContext2D).filter = "grayscale(1)";
  ctx.drawImage(image as CanvasImageSource, 0, 0);

  const output = await canvasToDataUrl(canvas, "image/png");
  return { output };
}

export const grayscale = defineTool({
  meta: {
    id: "image/grayscale",
    name: "Grayscale",
    description:
      "Free online grayscale converter — convert color images to grayscale using luminance-weighted averaging instantly in your browser. No data is stored. Uses standard BT.709 coefficients for accurate results.",
    category: "image",
    subgroup: "Effects",
    tier: ToolTier.CLIENT,
    keywords: ["image", "grayscale", "black", "white", "filter"],
    examples: [
      {
        title: "Black and White Photo",
        description: "Convert a color photo to grayscale",
        input: "data:image/png;base64,iVBORw0KGgo... (image data URL)",
        output: "data:image/png;base64,... (grayscale image data URL)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
