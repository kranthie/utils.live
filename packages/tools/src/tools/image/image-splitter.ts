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
  rows: z
    .number()
    .min(1)
    .max(20)
    .default(2)
    .describe("Number of rows to split into"),
  cols: z
    .number()
    .min(1)
    .max(20)
    .default(2)
    .describe("Number of columns to split into"),
});
const outputSchema = z.object({
  output: z.string().describe("Split tile data URLs separated by newlines"),
});

async function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): Promise<z.infer<typeof outputSchema>> {
  if (!input.input.trim()) throw new Error("Input cannot be empty");

  const dataUrl = ensureDataUrl(input.input);
  const rows = options?.rows ?? 2;
  const cols = options?.cols ?? 2;

  if (!isCanvasAvailable()) {
    return { output: dataUrl };
  }

  const { image, width, height } = await loadImage(dataUrl);

  const tileW = Math.floor(width / cols);
  const tileH = Math.floor(height / rows);
  const tiles: string[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const sx = col * tileW;
      const sy = row * tileH;
      const canvas = createCanvas(tileW, tileH);
      const ctx = getContext(canvas);
      ctx.drawImage(
        image as CanvasImageSource,
        sx,
        sy,
        tileW,
        tileH,
        0,
        0,
        tileW,
        tileH
      );
      const tileUrl = await canvasToDataUrl(canvas, "image/png");
      tiles.push(tileUrl);
    }
  }

  // Return all tiles separated by newlines
  return { output: tiles.join("\n") };
}

export const imageSplitter = defineTool({
  meta: {
    id: "image/image-splitter",
    name: "Image Splitter",
    description:
      "Free online image splitter — divide images into a grid of equal tiles by rows and columns instantly in your browser. No data is stored. Outputs individual tile images as data URLs.",
    category: "image",
    subgroup: "Editing",
    tier: ToolTier.CLIENT,
    keywords: ["image", "split", "grid", "divide", "slice"],
    examples: [
      {
        title: "Split Image into 2x2 Grid",
        description: "Split an image into 4 equal tiles in a 2x2 grid",
        input: { input: "data:image/png;base64,iVBORw0KGgo=" },
        output: "4 tile images as data URLs",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
