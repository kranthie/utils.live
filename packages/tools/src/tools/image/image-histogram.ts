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
const outputSchema = z.object({
  output: z.string().describe("Image histogram data as text report"),
});

async function execute(
  input: z.infer<typeof inputSchema>
): Promise<z.infer<typeof outputSchema>> {
  if (!input.input.trim()) throw new Error("Input cannot be empty");

  const dataUrl = ensureDataUrl(input.input);

  if (!isCanvasAvailable()) {
    return { output: dataUrl };
  }

  const { ctx, width, height } = await loadImageToCanvas(dataUrl);
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Count pixel values per channel
  const red = new Uint32Array(256);
  const green = new Uint32Array(256);
  const blue = new Uint32Array(256);
  const luminance = new Uint32Array(256);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    red[r] = (red[r] ?? 0) + 1;
    green[g] = (green[g] ?? 0) + 1;
    blue[b] = (blue[b] ?? 0) + 1;
    const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    luminance[lum] = (luminance[lum] ?? 0) + 1;
  }

  // Calculate statistics
  const totalPixels = width * height;
  const stats = (channel: Uint32Array, name: string): string => {
    let min = 255,
      max = 0,
      sum = 0;
    let peak = 0,
      peakVal = 0;
    for (let i = 0; i < 256; i++) {
      if (channel[i]! > 0) {
        if (i < min) min = i;
        if (i > max) max = i;
        sum += i * channel[i]!;
        if (channel[i]! > peakVal) {
          peakVal = channel[i]!;
          peak = i;
        }
      }
    }
    const mean = sum / totalPixels;
    return `${name}: min=${min}, max=${max}, mean=${mean.toFixed(1)}, mode=${peak}`;
  };

  const lines = [
    "Image Histogram",
    "===============",
    "",
    `Image: ${width}x${height}px (${totalPixels.toLocaleString()} pixels)`,
    "",
    "Channel Statistics:",
    `  ${stats(red, "Red      ")}`,
    `  ${stats(green, "Green    ")}`,
    `  ${stats(blue, "Blue     ")}`,
    `  ${stats(luminance, "Luminance")}`,
    "",
    "Distribution (0-255 in 16 bins):",
  ];

  // Show distribution in 16 bins
  const binSize = 16;
  const binLabels: string[] = [];
  const redBins: number[] = [];
  const greenBins: number[] = [];
  const blueBins: number[] = [];

  for (let bin = 0; bin < 256; bin += binSize) {
    const label = `${bin.toString().padStart(3)}-${(bin + binSize - 1).toString().padStart(3)}`;
    binLabels.push(label);
    let rSum = 0,
      gSum = 0,
      bSum = 0;
    for (let i = bin; i < bin + binSize && i < 256; i++) {
      rSum += red[i]!;
      gSum += green[i]!;
      bSum += blue[i]!;
    }
    redBins.push(rSum);
    greenBins.push(gSum);
    blueBins.push(bSum);
  }

  const maxBin = Math.max(...redBins, ...greenBins, ...blueBins, 1);
  const barWidth = 30;

  for (let i = 0; i < binLabels.length; i++) {
    const rBar = Math.round((redBins[i]! / maxBin) * barWidth);
    const gBar = Math.round((greenBins[i]! / maxBin) * barWidth);
    const bBar = Math.round((blueBins[i]! / maxBin) * barWidth);

    lines.push(
      `  ${binLabels[i]}  R${"#".repeat(rBar).padEnd(barWidth)} G${"#".repeat(gBar).padEnd(barWidth)} B${"#".repeat(bBar).padEnd(barWidth)}`
    );
  }

  return { output: lines.join("\n") };
}

export const imageHistogram = defineTool({
  meta: {
    id: "image/image-histogram",
    name: "Image Histogram",
    description:
      "Free online image histogram analyzer — visualize the distribution of red, green, blue, and luminance channels in images instantly in your browser. No data is stored. Generates SVG histogram charts.",
    category: "image",
    subgroup: "Analysis",
    tier: ToolTier.CLIENT,
    keywords: ["image", "histogram", "color", "distribution", "analysis"],
    examples: [
      {
        title: "Analyze Color Distribution",
        description:
          "Generate a color histogram showing RGB channel statistics",
        input: "data:image/png;base64,iVBORw0KGgo... (image data URL)",
        output:
          "Image Histogram\n===============\n\nImage: 800x600px (480,000 pixels)\n\nChannel Statistics:\n  Red      : min=0, max=255, mean=128.5, mode=140\n  Green    : min=12, max=245, mean=115.2, mode=120",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
