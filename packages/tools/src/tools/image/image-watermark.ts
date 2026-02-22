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
  text: z.string().default("Watermark").describe("Watermark text"),
  opacity: z.number().min(0).max(1).default(0.3).describe("Watermark opacity"),
  position: z
    .enum(["center", "top-left", "top-right", "bottom-left", "bottom-right"])
    .default("center")
    .describe("Watermark position"),
  fontSize: z.number().min(8).max(200).default(24).describe("Font size"),
  color: z.string().default("#000000").describe("Watermark text color"),
});
const outputSchema = z.object({
  output: z.string().describe("Watermarked image as data URL"),
});

async function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): Promise<z.infer<typeof outputSchema>> {
  if (!input.input.trim()) throw new Error("Input cannot be empty");

  const dataUrl = ensureDataUrl(input.input);
  const text = options?.text ?? "Watermark";
  const opacity = options?.opacity ?? 0.3;
  const position = options?.position ?? "center";
  const fontSize = options?.fontSize ?? 24;
  const color = options?.color ?? "#000000";

  if (!isCanvasAvailable()) {
    return { output: dataUrl };
  }

  const { canvas, ctx, width, height } = await loadImageToCanvas(dataUrl);

  ctx.globalAlpha = opacity;
  ctx.font = `${fontSize}px sans-serif`;
  ctx.fillStyle = color;

  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const textHeight = fontSize;

  let x: number;
  let y: number;

  switch (position) {
    case "top-left":
      x = 10;
      y = textHeight + 10;
      break;
    case "top-right":
      x = width - textWidth - 10;
      y = textHeight + 10;
      break;
    case "bottom-left":
      x = 10;
      y = height - 10;
      break;
    case "bottom-right":
      x = width - textWidth - 10;
      y = height - 10;
      break;
    case "center":
    default:
      x = (width - textWidth) / 2;
      y = (height + textHeight) / 2;
      break;
  }

  ctx.fillText(text, x, y);
  ctx.globalAlpha = 1;

  const output = await canvasToDataUrl(canvas, "image/png");
  return { output };
}

export const imageWatermark = defineTool({
  meta: {
    id: "image/image-watermark",
    name: "Image Watermark",
    description:
      "Free online image watermark tool — add text watermarks to images with custom font size, color, opacity, and position instantly in your browser. No data is stored. Supports corner and center placement.",
    category: "image",
    subgroup: "Editing",
    tier: ToolTier.CLIENT,
    keywords: ["image", "watermark", "text", "overlay"],
    examples: [
      {
        title: "Add Center Watermark",
        description: "Add a centered text watermark to an image",
        input: { input: "data:image/png;base64,iVBORw0KGgo=" },
        output: "Image with watermark overlay",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
