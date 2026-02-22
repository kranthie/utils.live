import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import {
  isCanvasAvailable,
  ensureDataUrl,
  loadImageToCanvas,
  canvasToDataUrl,
  hexToRgb,
} from "./canvas-utils";

const inputSchema = z.object({
  input: z.string().describe("Image data as base64 or data URL"),
});
const optionsSchema = z.object({
  darkColor: z.string().default("#000033").describe("Dark tone color"),
  lightColor: z.string().default("#ff6600").describe("Light tone color"),
});
const outputSchema = z.object({
  output: z.string().describe("Duotone image as data URL"),
});

async function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): Promise<z.infer<typeof outputSchema>> {
  if (!input.input.trim()) throw new Error("Input cannot be empty");

  const dataUrl = ensureDataUrl(input.input);
  const dark = hexToRgb(options?.darkColor ?? "#000033");
  const light = hexToRgb(options?.lightColor ?? "#ff6600");

  if (!isCanvasAvailable()) {
    return { output: dataUrl };
  }

  const { canvas, ctx, width, height } = await loadImageToCanvas(dataUrl);
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    // Calculate luminance
    const lum =
      (0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!) / 255;

    // Interpolate between dark and light colors based on luminance
    data[i] = Math.round(dark.r + (light.r - dark.r) * lum);
    data[i + 1] = Math.round(dark.g + (light.g - dark.g) * lum);
    data[i + 2] = Math.round(dark.b + (light.b - dark.b) * lum);
    // Alpha unchanged
  }

  ctx.putImageData(imageData, 0, 0);

  const output = await canvasToDataUrl(canvas, "image/png");
  return { output };
}

export const duotone = defineTool({
  meta: {
    id: "image/duotone",
    name: "Duotone",
    description:
      "Free online duotone image filter — apply two-tone color effects to images using custom highlight and shadow colors instantly in your browser. No data is stored. Converts to grayscale then maps to your chosen color pair.",
    category: "image",
    subgroup: "Effects",
    tier: ToolTier.CLIENT,
    keywords: ["image", "duotone", "two-tone", "color", "filter"],
    examples: [
      {
        title: "Navy and Orange Duotone",
        description:
          "Apply a duotone effect with navy shadows and orange highlights",
        input: "data:image/png;base64,iVBORw0KGgo... (image data URL)",
        output: "data:image/png;base64,... (duotone image data URL)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
