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
  intensity: z
    .number()
    .min(0)
    .max(1)
    .default(1)
    .describe("Sepia intensity (0-1)"),
});
const outputSchema = z.object({
  output: z.string().describe("Sepia-toned image as data URL"),
});

async function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): Promise<z.infer<typeof outputSchema>> {
  if (!input.input.trim()) throw new Error("Input cannot be empty");

  const dataUrl = ensureDataUrl(input.input);
  const intensity = options?.intensity ?? 1;

  if (!isCanvasAvailable()) {
    return { output: dataUrl };
  }

  const { image, width, height } = await loadImage(dataUrl);
  const canvas = createCanvas(width, height);
  const ctx = getContext(canvas);
  (ctx as CanvasRenderingContext2D).filter = `sepia(${intensity})`;
  ctx.drawImage(image as CanvasImageSource, 0, 0);

  const output = await canvasToDataUrl(canvas, "image/png");
  return { output };
}

export const sepia = defineTool({
  meta: {
    id: "image/sepia",
    name: "Sepia",
    description:
      "Free online sepia filter — apply a warm vintage sepia tone to images instantly in your browser. No data is stored. Uses classic sepia color matrix transformation.",
    category: "image",
    subgroup: "Effects",
    tier: ToolTier.CLIENT,
    keywords: ["image", "sepia", "vintage", "warm", "filter"],
    examples: [
      {
        title: "Apply Sepia Tone",
        description: "Apply a vintage sepia tone filter to an image",
        input: { input: "data:image/png;base64,iVBORw0KGgo=" },
        output: "Sepia-toned image as data URL",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
