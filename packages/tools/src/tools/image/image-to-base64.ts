import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Image as data URL (data:image/...;base64,...)"),
});

const outputSchema = z.object({
  output: z
    .string()
    .describe("Base64 encoded string (without data URL prefix)"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const data = input.input.trim();
  if (!data) throw new Error("Input cannot be empty");

  // If it's a data URL, extract the base64 part
  const dataUrlMatch = data.match(/^data:([^;]+);base64,(.+)$/);
  if (dataUrlMatch) {
    return { output: dataUrlMatch[2]! };
  }

  // If it already looks like base64, return as-is
  if (/^[A-Za-z0-9+/=]+$/.test(data.replace(/\s/g, ""))) {
    return { output: data.replace(/\s/g, "") };
  }

  throw new Error(
    "Input must be a data URL (data:image/...;base64,...) or base64 string"
  );
}

export const imageToBase64 = defineTool({
  meta: {
    id: "image/image-to-base64",
    name: "Image to Base64",
    description:
      "Free online image to base64 encoder — convert images to base64-encoded strings for embedding in HTML, CSS, or JSON instantly in your browser. No data is stored. Supports all common image formats.",
    category: "image",
    subgroup: "Conversion",
    tier: ToolTier.CLIENT,
    keywords: ["image", "base64", "convert", "encode"],
    examples: [
      {
        title: "Extract Base64 from Data URL",
        description: "Extract the base64 string from an image data URL",
        input: { input: "data:image/png;base64,iVBORw0KGgo=" },
        output: "iVBORw0KGgo=",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
