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
  x: z.number().min(0).default(0).describe("Crop X offset"),
  y: z.number().min(0).default(0).describe("Crop Y offset"),
  width: z.number().min(1).describe("Crop width"),
  height: z.number().min(1).describe("Crop height"),
});
const outputSchema = z.object({
  output: z.string().describe("Cropped image as data URL"),
});

async function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): Promise<z.infer<typeof outputSchema>> {
  if (!input.input.trim()) throw new Error("Input cannot be empty");

  const dataUrl = ensureDataUrl(input.input);
  const sx = options?.x ?? 0;
  const sy = options?.y ?? 0;
  const sw = options?.width ?? 100;
  const sh = options?.height ?? 100;

  if (!isCanvasAvailable()) {
    return { output: dataUrl };
  }

  const { image } = await loadImage(dataUrl);
  const canvas = createCanvas(sw, sh);
  const ctx = getContext(canvas);

  // drawImage(source, sx, sy, sw, sh, dx, dy, dw, dh)
  ctx.drawImage(image as CanvasImageSource, sx, sy, sw, sh, 0, 0, sw, sh);

  const output = await canvasToDataUrl(canvas, "image/png");
  return { output };
}

export const imageCropper = defineTool({
  meta: {
    id: "image/image-cropper",
    name: "Image Cropper",
    description:
      "Free online image cropper — crop images to exact pixel dimensions with custom X, Y offset instantly in your browser. No data is stored. Supports rectangular cropping with precise coordinate control.",
    category: "image",
    subgroup: "Editing",
    tier: ToolTier.CLIENT,
    keywords: ["image", "crop", "trim", "cut"],
    examples: [
      {
        title: "Crop Region",
        description: "Crop a 200x200 region from position (50, 50)",
        input: "data:image/png;base64,iVBORw0KGgo... (image data URL)",
        output: "data:image/png;base64,... (cropped image data URL)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
