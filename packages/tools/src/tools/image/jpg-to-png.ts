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
  input: z.string().describe("JPEG image data as base64 or data URL"),
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

export const jpgToPng = defineTool({
  meta: {
    id: "image/jpg-to-png",
    name: "JPG to PNG",
    description:
      "Free online JPG to PNG converter — convert JPEG images to lossless PNG format with transparency support instantly in your browser. No data is stored. Preserves original image quality.",
    category: "image",
    subgroup: "Conversion",
    tier: ToolTier.CLIENT,
    keywords: ["jpg", "jpeg", "png", "convert", "image"],
    examples: [
      {
        title: "Convert JPG to PNG",
        description: "Convert a JPEG image to lossless PNG format",
        input: { input: "data:image/jpeg;base64,/9j/4AAQ..." },
        output: "data:image/png;base64,...",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
