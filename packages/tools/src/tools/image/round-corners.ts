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
    .max(500)
    .default(20)
    .describe("Corner radius in pixels"),
});
const outputSchema = z.object({
  output: z.string().describe("Rounded-corner image as data URL"),
});

async function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): Promise<z.infer<typeof outputSchema>> {
  if (!input.input.trim()) throw new Error("Input cannot be empty");

  const dataUrl = ensureDataUrl(input.input);
  const radius = options?.radius ?? 20;

  if (!isCanvasAvailable()) {
    return { output: dataUrl };
  }

  const { image, width, height } = await loadImage(dataUrl);
  const canvas = createCanvas(width, height);
  const ctx = getContext(canvas);

  // Clamp radius to half the smallest dimension
  const r = Math.min(radius, width / 2, height / 2);

  // Create rounded rectangle clipping path
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(width - r, 0);
  ctx.arcTo(width, 0, width, r, r);
  ctx.lineTo(width, height - r);
  ctx.arcTo(width, height, width - r, height, r);
  ctx.lineTo(r, height);
  ctx.arcTo(0, height, 0, height - r, r);
  ctx.lineTo(0, r);
  ctx.arcTo(0, 0, r, 0, r);
  ctx.closePath();
  ctx.clip();

  ctx.drawImage(image as CanvasImageSource, 0, 0);

  const output = await canvasToDataUrl(canvas, "image/png");
  return { output };
}

export const roundCorners = defineTool({
  meta: {
    id: "image/round-corners",
    name: "Round Corners",
    description:
      "Free online round corners tool — add rounded corners with transparent backgrounds to images instantly in your browser. No data is stored. Adjustable corner radius with anti-aliased edges.",
    category: "image",
    subgroup: "Editing",
    tier: ToolTier.CLIENT,
    keywords: ["image", "round", "corners", "radius"],
    examples: [
      {
        title: "Round Image Corners",
        description: "Apply 20px rounded corners to an image",
        input: { input: "data:image/png;base64,iVBORw0KGgo=" },
        output: "Image with rounded corners as data URL",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
