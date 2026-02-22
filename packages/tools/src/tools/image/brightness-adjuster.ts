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
  brightness: z
    .number()
    .min(-100)
    .max(100)
    .default(0)
    .describe("Brightness adjustment (-100 to 100)"),
});
const outputSchema = z.object({
  output: z.string().describe("Brightness-adjusted image as data URL"),
});

async function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): Promise<z.infer<typeof outputSchema>> {
  if (!input.input.trim()) throw new Error("Input cannot be empty");

  const dataUrl = ensureDataUrl(input.input);
  const brightness = options?.brightness ?? 0;

  if (!isCanvasAvailable()) {
    return { output: dataUrl };
  }

  // Convert -100..100 to CSS brightness() factor: 0..2
  const factor = 1 + brightness / 100;

  const { image, width, height } = await loadImage(dataUrl);
  const canvas = createCanvas(width, height);
  const ctx = getContext(canvas);
  (ctx as CanvasRenderingContext2D).filter = `brightness(${factor})`;
  ctx.drawImage(image as CanvasImageSource, 0, 0);

  const output = await canvasToDataUrl(canvas, "image/png");
  return { output };
}

export const brightnessAdjuster = defineTool({
  meta: {
    id: "image/brightness-adjuster",
    name: "Brightness Adjuster",
    description:
      "Free online brightness adjuster — increase or decrease image brightness with a -100 to 100 range instantly in your browser. No data is stored. Preserves alpha channel transparency.",
    category: "image",
    subgroup: "Effects",
    tier: ToolTier.CLIENT,
    keywords: ["image", "brightness", "light", "dark", "filter"],
    examples: [
      {
        title: "Brighten Photo",
        description: "Increase brightness of a dark image by 50%",
        input: "data:image/png;base64,iVBORw0KGgo... (image data URL)",
        output: "data:image/png;base64,... (brightened image data URL)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
