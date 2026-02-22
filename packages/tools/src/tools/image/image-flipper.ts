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
  direction: z
    .enum(["horizontal", "vertical", "both"])
    .default("horizontal")
    .describe("Flip direction"),
});
const outputSchema = z.object({
  output: z.string().describe("Flipped image as data URL"),
});

async function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): Promise<z.infer<typeof outputSchema>> {
  if (!input.input.trim()) throw new Error("Input cannot be empty");

  const dataUrl = ensureDataUrl(input.input);
  const direction = options?.direction ?? "horizontal";

  if (!isCanvasAvailable()) {
    return { output: dataUrl };
  }

  const { image, width, height } = await loadImage(dataUrl);
  const canvas = createCanvas(width, height);
  const ctx = getContext(canvas);

  const scaleX = direction === "horizontal" || direction === "both" ? -1 : 1;
  const scaleY = direction === "vertical" || direction === "both" ? -1 : 1;

  ctx.translate(scaleX === -1 ? width : 0, scaleY === -1 ? height : 0);
  ctx.scale(scaleX, scaleY);
  ctx.drawImage(image as CanvasImageSource, 0, 0);

  const output = await canvasToDataUrl(canvas, "image/png");
  return { output };
}

export const imageFlipper = defineTool({
  meta: {
    id: "image/image-flipper",
    name: "Image Flipper",
    description:
      "Free online image flipper — flip images horizontally or vertically with one click instantly in your browser. No data is stored. Supports both mirror and vertical flip operations.",
    category: "image",
    subgroup: "Editing",
    tier: ToolTier.CLIENT,
    keywords: ["image", "flip", "mirror", "reverse"],
    examples: [
      {
        title: "Mirror Image",
        description: "Flip an image horizontally to create a mirror effect",
        input: "data:image/png;base64,iVBORw0KGgo... (image data URL)",
        output:
          "data:image/png;base64,... (horizontally flipped image data URL)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
