import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Base64 encoded image data or existing data URL"),
});

const optionsSchema = z.object({
  mimeType: z
    .enum([
      "image/png",
      "image/jpeg",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "image/bmp",
      "image/x-icon",
    ])
    .default("image/png")
    .describe("Image MIME type"),
});

const outputSchema = z.object({
  output: z.string().describe("Complete data URL for the image"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

function execute(input: Input, options?: Options): Output {
  const data = input.input.trim();
  if (!data) throw new Error("Input cannot be empty");

  // Already a data URL
  if (data.startsWith("data:")) {
    return { output: data };
  }

  const mimeType = options?.mimeType ?? "image/png";
  const cleanBase64 = data.replace(/\s/g, "");

  if (!/^[A-Za-z0-9+/=]+$/.test(cleanBase64)) {
    throw new Error("Invalid base64 string");
  }

  return { output: `data:${mimeType};base64,${cleanBase64}` };
}

export const imageToDataUrl = defineTool({
  meta: {
    id: "image/image-to-data-url",
    name: "Image to Data URL",
    description:
      "Free online image to data URL converter — convert images to data URI strings for inline embedding in HTML and CSS instantly in your browser. No data is stored. Outputs ready-to-use data:image/... URIs.",
    category: "image",
    subgroup: "Conversion",
    tier: ToolTier.CLIENT,
    keywords: ["image", "data-url", "base64", "embed"],
    examples: [
      {
        title: "Create Data URL from Base64",
        description:
          "Wrap a base64 string in a complete data URL with MIME type",
        input: { input: "iVBORw0KGgo=" },
        output: "data:image/png;base64,iVBORw0KGgo=",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
