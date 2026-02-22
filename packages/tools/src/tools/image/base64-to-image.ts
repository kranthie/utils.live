import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Base64 encoded image data"),
});

const optionsSchema = z.object({
  mimeType: z
    .enum([
      "image/png",
      "image/jpeg",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ])
    .default("image/png")
    .describe("Image MIME type"),
});

const outputSchema = z.object({
  output: z.string().describe("Image as data URL"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

function execute(input: Input, options?: Options): Output {
  const data = input.input.trim();
  if (!data) throw new Error("Input cannot be empty");

  const mimeType = options?.mimeType ?? "image/png";

  // If it's already a data URL, return it
  if (data.startsWith("data:image/")) {
    return { output: data };
  }

  // Strip any whitespace from base64
  const cleanBase64 = data.replace(/\s/g, "");

  // Basic base64 validation
  if (!/^[A-Za-z0-9+/=]+$/.test(cleanBase64)) {
    throw new Error(
      "Invalid base64 string. Input must contain only base64 characters (A-Z, a-z, 0-9, +, /, =)."
    );
  }

  return { output: `data:${mimeType};base64,${cleanBase64}` };
}

export const base64ToImage = defineTool({
  meta: {
    id: "image/base64-to-image",
    name: "Base64 to Image",
    description:
      "Free online base64 to image converter — decode base64-encoded image data back to viewable images instantly in your browser. No data is stored. Supports PNG, JPEG, GIF, WebP, and SVG formats.",
    category: "image",
    subgroup: "Conversion",
    tier: ToolTier.CLIENT,
    keywords: ["base64", "image", "convert", "decode", "data-url"],
    examples: [
      {
        title: "Decode Base64 PNG",
        description: "Convert base64 string to a displayable image data URL",
        input:
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        output:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      },
    ],
    ui: {
      outputRenderer: "image",
    },
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
