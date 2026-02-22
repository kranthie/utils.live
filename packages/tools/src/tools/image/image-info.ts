import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { isCanvasAvailable, ensureDataUrl, loadImage } from "./canvas-utils";

const inputSchema = z.object({
  input: z.string().describe("Image data as base64 or data URL"),
});
const outputSchema = z.object({
  output: z.string().describe("Image information"),
});

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function execute(
  input: z.infer<typeof inputSchema>
): Promise<z.infer<typeof outputSchema>> {
  const data = input.input.trim();
  if (!data) throw new Error("Input cannot be empty");

  const lines: string[] = ["Image Info", "==========", ""];
  const dataUrl = ensureDataUrl(data);

  // Detect format from data URL
  const dataUrlMatch = dataUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
  if (dataUrlMatch) {
    const mimeType = dataUrlMatch[1]!;
    const base64Data = dataUrlMatch[2]!;
    const sizeBytes = Math.ceil(base64Data.length * 0.75);

    lines.push(`MIME type: ${mimeType}`);
    lines.push(`Format: ${mimeType.split("/")[1]!.toUpperCase()}`);
    lines.push(`Base64 length: ${base64Data.length} chars`);
    lines.push(`Estimated file size: ${formatSize(sizeBytes)}`);
    lines.push(`Data URL length: ${dataUrl.length} chars`);
  } else {
    lines.push("Format: Unknown");
    lines.push(`Input length: ${data.length} chars`);
  }

  // Try to get dimensions from Canvas API
  if (isCanvasAvailable()) {
    try {
      const { width, height } = await loadImage(dataUrl);
      lines.push("");
      lines.push(`Width: ${width}px`);
      lines.push(`Height: ${height}px`);
      lines.push(`Aspect ratio: ${(width / height).toFixed(4)}`);
      lines.push(`Total pixels: ${(width * height).toLocaleString()}`);
    } catch {
      // Image loading failed, skip dimensions
    }
  }

  return { output: lines.join("\n") };
}

export const imageInfo = defineTool({
  meta: {
    id: "image/image-info",
    name: "Image Info",
    description:
      "Free online image info viewer — display dimensions, file size, format, color depth, and aspect ratio of images instantly in your browser. No data is stored. Analyzes PNG, JPEG, GIF, WebP, and SVG files.",
    category: "image",
    subgroup: "Analysis",
    tier: ToolTier.CLIENT,
    keywords: ["image", "info", "metadata", "size", "format"],
    examples: [
      {
        title: "Inspect Image",
        description: "Get dimensions, format, and file size of an image",
        input: "data:image/png;base64,iVBORw0KGgo... (image data URL)",
        output:
          "Image Info\n==========\n\nMIME type: image/png\nFormat: PNG\nBase64 length: 1234 chars\nEstimated file size: 0.9 KB\n\nWidth: 200px\nHeight: 150px\nAspect ratio: 1.3333",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
