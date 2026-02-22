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
  angle: z
    .number()
    .min(-360)
    .max(360)
    .default(90)
    .describe("Rotation angle in degrees"),
});
const outputSchema = z.object({
  output: z.string().describe("Rotated image as data URL"),
});

async function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): Promise<z.infer<typeof outputSchema>> {
  if (!input.input.trim()) throw new Error("Input cannot be empty");

  const dataUrl = ensureDataUrl(input.input);
  const angle = options?.angle ?? 90;

  if (!isCanvasAvailable()) {
    return { output: dataUrl };
  }

  const { image, width, height } = await loadImage(dataUrl);
  const radians = (angle * Math.PI) / 180;
  const cos = Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians));

  // Calculate the bounding box of the rotated image
  const newW = Math.ceil(width * cos + height * sin);
  const newH = Math.ceil(width * sin + height * cos);

  const canvas = createCanvas(newW, newH);
  const ctx = getContext(canvas);

  ctx.translate(newW / 2, newH / 2);
  ctx.rotate(radians);
  ctx.drawImage(
    image as CanvasImageSource,
    -width / 2,
    -height / 2,
    width,
    height
  );

  const output = await canvasToDataUrl(canvas, "image/png");
  return { output };
}

export const imageRotator = defineTool({
  meta: {
    id: "image/image-rotator",
    name: "Image Rotator",
    description:
      "Free online image rotator — rotate images by any angle from 0 to 360 degrees instantly in your browser. No data is stored. Automatically adjusts canvas size to fit rotated content.",
    category: "image",
    subgroup: "Editing",
    tier: ToolTier.CLIENT,
    keywords: ["image", "rotate", "turn", "angle"],
    examples: [
      {
        title: "Rotate Image 90 Degrees",
        description: "Rotate an image 90 degrees clockwise",
        input: { input: "data:image/png;base64,iVBORw0KGgo=" },
        output: "Rotated image as data URL",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
