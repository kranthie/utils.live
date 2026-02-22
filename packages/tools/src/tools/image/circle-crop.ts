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
  output: z.string().describe("Circle-cropped image as data URL"),
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
  const size = Math.min(width, height);
  const canvas = createCanvas(size, size);
  const ctx = getContext(canvas);

  // Create circular clipping path
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  // Center the image in the circle
  const offsetX = (width - size) / 2;
  const offsetY = (height - size) / 2;
  ctx.drawImage(
    image as CanvasImageSource,
    offsetX,
    offsetY,
    size,
    size,
    0,
    0,
    size,
    size
  );

  const output = await canvasToDataUrl(canvas, "image/png");
  return { output };
}

export const circleCrop = defineTool({
  meta: {
    id: "image/circle-crop",
    name: "Circle Crop",
    description:
      "Free online circle crop tool — crop images into perfect circles with transparent backgrounds instantly in your browser. No data is stored. Uses the shorter dimension as diameter with anti-aliased edges.",
    category: "image",
    subgroup: "Editing",
    tier: ToolTier.CLIENT,
    keywords: ["image", "circle", "crop", "avatar", "profile"],
    examples: [
      {
        title: "Profile Avatar",
        description: "Crop a photo into a circular shape for a profile avatar",
        input: "data:image/png;base64,iVBORw0KGgo... (image data URL)",
        output: "data:image/png;base64,... (circle-cropped image data URL)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
