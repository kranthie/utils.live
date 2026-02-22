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
  input1: z.string().describe("First image data as base64 or data URL"),
  input2: z.string().describe("Second image data as base64 or data URL"),
});

const optionsSchema = z.object({
  threshold: z
    .number()
    .min(0)
    .max(255)
    .default(25)
    .describe("Color difference threshold (0-255)"),
});

const outputSchema = z.object({
  original: z.string().describe("First image data URL"),
  modified: z.string().describe("Diff visualization as data URL"),
});

async function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): Promise<z.infer<typeof outputSchema>> {
  if (!input.input1.trim() || !input.input2.trim())
    throw new Error("Both inputs are required");

  const dataUrl1 = ensureDataUrl(input.input1);
  const dataUrl2 = ensureDataUrl(input.input2);
  const threshold = options?.threshold ?? 25;

  if (!isCanvasAvailable()) {
    return { original: dataUrl1, modified: dataUrl2 };
  }

  const img1 = await loadImage(dataUrl1);
  const img2 = await loadImage(dataUrl2);

  // Use the larger dimensions
  const width = Math.max(img1.width, img2.width);
  const height = Math.max(img1.height, img2.height);

  // Draw both images to canvases
  const canvas1 = createCanvas(width, height);
  const ctx1 = getContext(canvas1);
  ctx1.drawImage(img1.image as CanvasImageSource, 0, 0);
  const data1 = ctx1.getImageData(0, 0, width, height);

  const canvas2 = createCanvas(width, height);
  const ctx2 = getContext(canvas2);
  ctx2.drawImage(img2.image as CanvasImageSource, 0, 0);
  const data2 = ctx2.getImageData(0, 0, width, height);

  // Create diff canvas
  const diffCanvas = createCanvas(width, height);
  const diffCtx = getContext(diffCanvas);
  const diffData = diffCtx.createImageData(width, height);

  let diffPixels = 0;
  const totalPixels = width * height;

  for (let i = 0; i < data1.data.length; i += 4) {
    const rDiff = Math.abs(data1.data[i]! - data2.data[i]!);
    const gDiff = Math.abs(data1.data[i + 1]! - data2.data[i + 1]!);
    const bDiff = Math.abs(data1.data[i + 2]! - data2.data[i + 2]!);

    const maxDiff = Math.max(rDiff, gDiff, bDiff);

    if (maxDiff > threshold) {
      // Highlight difference in red
      diffData.data[i] = 255;
      diffData.data[i + 1] = 0;
      diffData.data[i + 2] = 0;
      diffData.data[i + 3] = Math.min(255, maxDiff * 3);
      diffPixels++;
    } else {
      // Show original pixel dimmed
      diffData.data[i] = data1.data[i]!;
      diffData.data[i + 1] = data1.data[i + 1]!;
      diffData.data[i + 2] = data1.data[i + 2]!;
      diffData.data[i + 3] = 128;
    }
  }

  diffCtx.putImageData(diffData, 0, 0);

  const similarity = ((1 - diffPixels / totalPixels) * 100).toFixed(2);

  // Draw similarity text on the diff image
  diffCtx.globalAlpha = 1;
  diffCtx.fillStyle = "#ffffff";
  diffCtx.strokeStyle = "#000000";
  diffCtx.lineWidth = 2;
  diffCtx.font = "bold 14px sans-serif";
  const text = `${similarity}% similar | ${diffPixels} pixels differ`;
  diffCtx.strokeText(text, 5, 18);
  diffCtx.fillText(text, 5, 18);

  const original = await canvasToDataUrl(canvas1, "image/png");
  const modified = await canvasToDataUrl(diffCanvas, "image/png");

  return { original, modified };
}

export const imageDiff = defineTool({
  meta: {
    id: "image/image-diff",
    name: "Image Diff",
    description:
      "Free online image diff tool — compare two images pixel by pixel and highlight differences instantly in your browser. No data is stored. Displays changed pixels in red with configurable threshold.",
    category: "image",
    subgroup: "Analysis",
    tier: ToolTier.CLIENT,
    keywords: ["image", "diff", "compare", "difference"],
    examples: [
      {
        title: "Compare Screenshots",
        description:
          "Compare two screenshots and highlight pixel differences in red",
        input: {
          input1: "data:image/png;base64,iVBORw0KGgo... (first image)",
          input2: "data:image/png;base64,iVBORw0KGgo... (second image)",
        },
        output:
          "data:image/png;base64,... (diff visualization with red-highlighted changes)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
