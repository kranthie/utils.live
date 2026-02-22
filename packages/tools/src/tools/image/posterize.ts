import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import {
  isCanvasAvailable,
  ensureDataUrl,
  loadImageToCanvas,
  canvasToDataUrl,
} from "./canvas-utils";

const inputSchema = z.object({
  input: z.string().describe("Image data as base64 or data URL"),
});
const optionsSchema = z.object({
  levels: z
    .number()
    .min(2)
    .max(16)
    .default(4)
    .describe("Number of color levels per channel"),
});
const outputSchema = z.object({
  output: z.string().describe("Posterized image as data URL"),
});

async function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): Promise<z.infer<typeof outputSchema>> {
  if (!input.input.trim()) throw new Error("Input cannot be empty");

  const dataUrl = ensureDataUrl(input.input);
  const levels = options?.levels ?? 4;

  if (!isCanvasAvailable()) {
    return { output: dataUrl };
  }

  const { canvas, ctx, width, height } = await loadImageToCanvas(dataUrl);
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const step = 255 / (levels - 1);

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.round(Math.round(data[i]! / step) * step); // R
    data[i + 1] = Math.round(Math.round(data[i + 1]! / step) * step); // G
    data[i + 2] = Math.round(Math.round(data[i + 2]! / step) * step); // B
    // Alpha unchanged
  }

  ctx.putImageData(imageData, 0, 0);

  const output = await canvasToDataUrl(canvas, "image/png");
  return { output };
}

export const posterize = defineTool({
  meta: {
    id: "image/posterize",
    name: "Posterize",
    description:
      "Free online posterize tool — reduce the number of color levels in images for a poster-style effect instantly in your browser. No data is stored. Adjustable from 2 to 32 color levels per channel.",
    category: "image",
    subgroup: "Effects",
    tier: ToolTier.CLIENT,
    keywords: ["image", "posterize", "poster", "color", "filter"],
    examples: [
      {
        title: "Posterize Image",
        description: "Reduce image colors to create a poster-like effect",
        input: { input: "data:image/png;base64,iVBORw0KGgo=" },
        output: "Posterized image with reduced color levels",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
