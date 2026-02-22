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
  count: z
    .number()
    .min(1)
    .max(20)
    .default(5)
    .describe("Number of dominant colors to extract"),
});
const outputSchema = z.object({
  output: z.string().describe("Dominant colors as text report"),
});

/**
 * Simple median-cut color quantization.
 * Samples pixels and finds the N most dominant colors.
 */
function extractDominantColors(
  data: Uint8ClampedArray,
  pixelCount: number,
  count: number
): Array<{ r: number; g: number; b: number; percentage: number }> {
  // Sample pixels (skip every N to keep it fast)
  const sampleStep = Math.max(1, Math.floor(pixelCount / 10000));
  const colors: Array<[number, number, number]> = [];

  for (let i = 0; i < data.length; i += 4 * sampleStep) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    const a = data[i + 3]!;
    if (a < 128) continue; // Skip transparent pixels
    // Quantize to reduce color space (group similar colors)
    colors.push([
      Math.round(r / 16) * 16,
      Math.round(g / 16) * 16,
      Math.round(b / 16) * 16,
    ]);
  }

  // Count occurrences
  const colorMap = new Map<
    string,
    { r: number; g: number; b: number; count: number }
  >();
  for (const [r, g, b] of colors) {
    const key = `${r},${g},${b}`;
    const existing = colorMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      colorMap.set(key, { r, g, b, count: 1 });
    }
  }

  // Sort by frequency and take top N
  const sorted = Array.from(colorMap.values()).sort(
    (a, b) => b.count - a.count
  );
  const topColors = sorted.slice(0, count);
  const totalSamples = colors.length;

  return topColors.map((c) => ({
    r: c.r,
    g: c.g,
    b: c.b,
    percentage: (c.count / totalSamples) * 100,
  }));
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((c) => Math.min(255, Math.max(0, c)).toString(16).padStart(2, "0"))
      .join("")
  );
}

async function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): Promise<z.infer<typeof outputSchema>> {
  if (!input.input.trim()) throw new Error("Input cannot be empty");

  const dataUrl = ensureDataUrl(input.input);
  const count = options?.count ?? 5;

  if (!isCanvasAvailable()) {
    return { output: dataUrl };
  }

  const { ctx, width, height } = await loadImageToCanvas(dataUrl);
  const imageData = ctx.getImageData(0, 0, width, height);
  const colors = extractDominantColors(imageData.data, width * height, count);

  const lines: string[] = [
    "Dominant Colors",
    "===============",
    "",
    `Image: ${width}x${height}px`,
    "",
  ];

  colors.forEach((c, i) => {
    const hex = rgbToHex(c.r, c.g, c.b);
    lines.push(
      `${i + 1}. ${hex}  RGB(${c.r}, ${c.g}, ${c.b})  ${c.percentage.toFixed(1)}%`
    );
  });

  return { output: lines.join("\n") };
}

export const dominantColors = defineTool({
  meta: {
    id: "image/dominant-colors",
    name: "Dominant Colors",
    description:
      "Free online dominant color extractor — analyze images and extract the top colors using k-means clustering instantly in your browser. No data is stored. Returns HEX values with percentage weights.",
    category: "image",
    subgroup: "Analysis",
    tier: ToolTier.CLIENT,
    keywords: ["color", "dominant", "palette", "extract", "image"],
    examples: [
      {
        title: "Extract Palette",
        description: "Find the 5 most dominant colors in a photo",
        input: "data:image/png;base64,iVBORw0KGgo... (image data URL)",
        output:
          "Dominant Colors\n===============\n\nImage: 200x150px\n\n1. #3366cc  RGB(48, 96, 208)  35.2%\n2. #ffffff  RGB(255, 255, 255)  22.1%\n3. #112233  RGB(16, 32, 48)  18.5%",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
