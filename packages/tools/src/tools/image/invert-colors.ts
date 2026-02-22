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
  output: z.string().describe("Color-inverted image as data URL"),
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
  (ctx as CanvasRenderingContext2D).filter = "invert(1)";
  ctx.drawImage(image as CanvasImageSource, 0, 0);

  const output = await canvasToDataUrl(canvas, "image/png");
  return { output };
}

export const invertColors = defineTool({
  meta: {
    id: "image/invert-colors",
    name: "Invert Colors",
    description:
      "Free online color inverter — invert all colors in an image to create a negative effect instantly in your browser. No data is stored. Preserves alpha channel transparency.",
    category: "image",
    subgroup: "Effects",
    tier: ToolTier.CLIENT,
    keywords: ["image", "invert", "negative", "colors", "filter"],
    examples: [
      {
        title: "Invert Image Colors",
        description: "Create a color-negative version of an image",
        input: { input: "data:image/png;base64,iVBORw0KGgo=" },
        output: "Color-inverted image as data URL",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
