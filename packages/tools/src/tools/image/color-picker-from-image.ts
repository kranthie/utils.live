import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import {
  isCanvasAvailable,
  ensureDataUrl,
  loadImageToCanvas,
} from "./canvas-utils";

const inputSchema = z.object({
  input: z.string().describe("Image data as base64 or data URL"),
});
const optionsSchema = z.object({
  x: z.number().min(0).default(0).describe("X coordinate to sample"),
  y: z.number().min(0).default(0).describe("Y coordinate to sample"),
  sampleSize: z
    .number()
    .min(1)
    .max(50)
    .default(1)
    .describe("Sample area size (1 = single pixel)"),
});
const outputSchema = z.object({
  output: z.string().describe("Color information at coordinates"),
});

function rgbToHsl(
  r: number,
  g: number,
  b: number
): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

async function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): Promise<z.infer<typeof outputSchema>> {
  if (!input.input.trim()) throw new Error("Input cannot be empty");

  const dataUrl = ensureDataUrl(input.input);
  const px = options?.x ?? 0;
  const py = options?.y ?? 0;
  const sampleSize = options?.sampleSize ?? 1;

  if (!isCanvasAvailable()) {
    return { output: dataUrl };
  }

  const { ctx, width, height } = await loadImageToCanvas(dataUrl);

  // Clamp coordinates to image bounds
  const x = Math.min(px, width - 1);
  const y = Math.min(py, height - 1);
  const half = Math.floor(sampleSize / 2);

  // Sample the area
  const x1 = Math.max(0, x - half);
  const y1 = Math.max(0, y - half);
  const x2 = Math.min(width, x + half + 1);
  const y2 = Math.min(height, y + half + 1);
  const sw = x2 - x1;
  const sh = y2 - y1;

  const imageData = ctx.getImageData(x1, y1, sw, sh);
  const data = imageData.data;

  let rSum = 0,
    gSum = 0,
    bSum = 0,
    aSum = 0;
  const pixelCount = sw * sh;

  for (let i = 0; i < data.length; i += 4) {
    rSum += data[i]!;
    gSum += data[i + 1]!;
    bSum += data[i + 2]!;
    aSum += data[i + 3]!;
  }

  const r = Math.round(rSum / pixelCount);
  const g = Math.round(gSum / pixelCount);
  const b = Math.round(bSum / pixelCount);
  const a = Math.round(aSum / pixelCount);
  const hsl = rgbToHsl(r, g, b);

  const hex =
    "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("");

  const lines = [
    "Color Picker",
    "============",
    "",
    `Coordinates: (${x}, ${y})`,
    `Sample size: ${sampleSize}x${sampleSize}px`,
    `Image size: ${width}x${height}px`,
    "",
    "Color Values:",
    `  HEX: ${hex}`,
    `  RGB: rgb(${r}, ${g}, ${b})`,
    `  RGBA: rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(2)})`,
    `  HSL: hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
  ];

  return { output: lines.join("\n") };
}

export const colorPickerFromImage = defineTool({
  meta: {
    id: "image/color-picker-from-image",
    name: "Color Picker from Image",
    description:
      "Free online color picker from image — extract the color value at any pixel coordinate from an image instantly in your browser. No data is stored. Returns HEX, RGB, and HSL color values.",
    category: "image",
    subgroup: "Analysis",
    tier: ToolTier.CLIENT,
    keywords: ["color", "picker", "image", "eyedropper", "sample"],
    examples: [
      {
        title: "Sample Pixel Color",
        description: "Pick a color from specific coordinates in an image",
        input: "data:image/png;base64,iVBORw0KGgo... (image data URL)",
        output:
          "Color Picker\n============\n\nCoordinates: (0, 0)\nSample size: 1x1px\n\nColor Values:\n  HEX: #ff6b6b\n  RGB: rgb(255, 107, 107)\n  RGBA: rgba(255, 107, 107, 1.00)\n  HSL: hsl(0, 100%, 71%)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
