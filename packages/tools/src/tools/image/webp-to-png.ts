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
  input: z.string().describe("WebP image data as base64 or data URL"),
});
const outputSchema = z.object({
  output: z.string().describe("PNG image as data URL"),
});

async function execute(
  input: z.infer<typeof inputSchema>
): Promise<z.infer<typeof outputSchema>> {
  if (!input.input.trim()) throw new Error("Input cannot be empty");

  const dataUrl = ensureDataUrl(input.input);

  if (!isCanvasAvailable()) {
    return { output: dataUrl };
  }

  const { canvas } = await loadImageToCanvas(dataUrl);
  const output = await canvasToDataUrl(canvas, "image/png");
  return { output };
}

export const webpToPng = defineTool({
  meta: {
    id: "image/webp-to-png",
    name: "WebP to PNG",
    description:
      "Free online WebP to PNG converter — convert WebP images to lossless PNG format instantly in your browser. No data is stored. Preserves transparency and original image quality.",
    category: "image",
    subgroup: "Conversion",
    tier: ToolTier.CLIENT,
    keywords: ["webp", "png", "convert", "image"],
    examples: [
      {
        title: "Convert WebP to PNG",
        description:
          "Convert a WebP image to PNG format for broader compatibility",
        input: { input: "data:image/webp;base64,UklGRh4A..." },
        output: "data:image/png;base64,...",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
