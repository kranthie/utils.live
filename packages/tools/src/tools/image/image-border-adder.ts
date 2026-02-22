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
  borderWidth: z
    .number()
    .min(1)
    .max(200)
    .default(10)
    .describe("Border width in pixels"),
  borderColor: z.string().default("#000000").describe("Border color (hex)"),
  borderStyle: z
    .enum(["solid", "double", "rounded"])
    .default("solid")
    .describe("Border style"),
});
const outputSchema = z.object({
  output: z.string().describe("Bordered image as data URL"),
});

async function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): Promise<z.infer<typeof outputSchema>> {
  if (!input.input.trim()) throw new Error("Input cannot be empty");

  const dataUrl = ensureDataUrl(input.input);
  const bw = options?.borderWidth ?? 10;
  const color = options?.borderColor ?? "#000000";
  const style = options?.borderStyle ?? "solid";

  if (!isCanvasAvailable()) {
    return { output: dataUrl };
  }

  const { image, width, height } = await loadImage(dataUrl);

  const newW = width + bw * 2;
  const newH = height + bw * 2;
  const canvas = createCanvas(newW, newH);
  const ctx = getContext(canvas);

  // Fill entire canvas with border color
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, newW, newH);

  if (style === "double") {
    // Double border: outer border, gap, inner border
    const inner = Math.max(1, Math.floor(bw / 3));
    const gap = Math.max(1, Math.floor(bw / 3));

    // Clear inner area for gap
    ctx.clearRect(inner, inner, newW - inner * 2, newH - inner * 2);

    // Draw inner border
    ctx.fillStyle = color;
    ctx.fillRect(
      inner + gap,
      inner + gap,
      newW - (inner + gap) * 2,
      newH - (inner + gap) * 2
    );

    // Clear center for image
    ctx.clearRect(bw, bw, width, height);
  } else if (style === "rounded") {
    // Clear center with rounded corners
    const r = Math.min(bw * 2, width / 4, height / 4);
    ctx.beginPath();
    ctx.moveTo(bw + r, bw);
    ctx.lineTo(bw + width - r, bw);
    ctx.arcTo(bw + width, bw, bw + width, bw + r, r);
    ctx.lineTo(bw + width, bw + height - r);
    ctx.arcTo(bw + width, bw + height, bw + width - r, bw + height, r);
    ctx.lineTo(bw + r, bw + height);
    ctx.arcTo(bw, bw + height, bw, bw + height - r, r);
    ctx.lineTo(bw, bw + r);
    ctx.arcTo(bw, bw, bw + r, bw, r);
    ctx.closePath();
    ctx.clip();
  }

  // Draw the image in the center
  ctx.drawImage(image as CanvasImageSource, bw, bw);

  const output = await canvasToDataUrl(canvas, "image/png");
  return { output };
}

export const imageBorderAdder = defineTool({
  meta: {
    id: "image/image-border-adder",
    name: "Image Border Adder",
    description:
      "Free online image border tool — add solid color borders of custom width to images instantly in your browser. No data is stored. Supports any border width and color in HEX format.",
    category: "image",
    subgroup: "Editing",
    tier: ToolTier.CLIENT,
    keywords: ["image", "border", "frame", "add"],
    examples: [
      {
        title: "Black Photo Border",
        description: "Add a 10px black solid border around an image",
        input: "data:image/png;base64,iVBORw0KGgo... (image data URL)",
        output: "data:image/png;base64,... (bordered image data URL)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
