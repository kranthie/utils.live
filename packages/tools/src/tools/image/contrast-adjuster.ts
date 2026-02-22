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
  contrast: z
    .number()
    .min(-100)
    .max(100)
    .default(0)
    .describe("Contrast adjustment (-100 to 100)"),
});
const outputSchema = z.object({
  output: z.string().describe("Contrast-adjusted image as data URL"),
});

async function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): Promise<z.infer<typeof outputSchema>> {
  if (!input.input.trim()) throw new Error("Input cannot be empty");

  const dataUrl = ensureDataUrl(input.input);
  const contrast = options?.contrast ?? 0;

  if (!isCanvasAvailable()) {
    return { output: dataUrl };
  }

  // Convert -100..100 to CSS contrast() factor: 0..2
  const factor = 1 + contrast / 100;

  const { image, width, height } = await loadImage(dataUrl);
  const canvas = createCanvas(width, height);
  const ctx = getContext(canvas);
  (ctx as CanvasRenderingContext2D).filter = `contrast(${factor})`;
  ctx.drawImage(image as CanvasImageSource, 0, 0);

  const output = await canvasToDataUrl(canvas, "image/png");
  return { output };
}

export const contrastAdjuster = defineTool({
  meta: {
    id: "image/contrast-adjuster",
    name: "Contrast Adjuster",
    description:
      "Free online contrast adjuster — increase or decrease image contrast with a -100 to 100 range instantly in your browser. No data is stored. Preserves alpha channel transparency.",
    category: "image",
    subgroup: "Effects",
    tier: ToolTier.CLIENT,
    keywords: ["image", "contrast", "filter"],
    examples: [
      {
        title: "Increase Contrast",
        description: "Boost image contrast by 50%",
        input: "data:image/png;base64,iVBORw0KGgo... (image data URL)",
        output: "data:image/png;base64,... (contrast-adjusted image data URL)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
