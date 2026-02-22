import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  width: z
    .number()
    .min(1)
    .max(4000)
    .default(300)
    .describe("Image width in pixels"),
  height: z
    .number()
    .min(1)
    .max(4000)
    .default(200)
    .describe("Image height in pixels"),
  text: z.string().optional().describe("Custom text (defaults to dimensions)"),
  backgroundColor: z.string().default("#cccccc").describe("Background color"),
  textColor: z.string().default("#666666").describe("Text color"),
  format: z
    .enum(["svg", "url"])
    .default("svg")
    .describe("Output format: SVG or placeholder URL"),
});

const outputSchema = z.object({
  output: z.string().describe("Placeholder image (SVG or URL)"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const text = input.text || `${input.width}x${input.height}`;
  const fontSize = Math.min(
    input.width / (text.length * 0.6),
    input.height / 3,
    48
  );

  if (input.format === "url") {
    return {
      output: [
        `Placeholder Image URL`,
        `=====================`,
        ``,
        `via.placeholder.com:`,
        `  https://via.placeholder.com/${input.width}x${input.height}/${input.backgroundColor.replace("#", "")}/${input.textColor.replace("#", "")}?text=${encodeURIComponent(text)}`,
        ``,
        `placehold.co:`,
        `  https://placehold.co/${input.width}x${input.height}/${input.backgroundColor.replace("#", "")}/${input.textColor.replace("#", "")}?text=${encodeURIComponent(text)}`,
        ``,
        `dummyimage.com:`,
        `  https://dummyimage.com/${input.width}x${input.height}/${input.backgroundColor.replace("#", "")}/${input.textColor.replace("#", "")}&text=${encodeURIComponent(text)}`,
      ].join("\n"),
    };
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${input.width}" height="${input.height}" viewBox="0 0 ${input.width} ${input.height}">
  <rect width="${input.width}" height="${input.height}" fill="${input.backgroundColor}"/>
  <text x="${input.width / 2}" y="${input.height / 2}" text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif" font-size="${fontSize}" fill="${input.textColor}">${escapeXml(text)}</text>
</svg>`;

  return { output: svg };
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const placeholderImage = defineTool({
  meta: {
    id: "image/placeholder-image",
    name: "Placeholder Image",
    description:
      "Free online placeholder image generator — create placeholder images as SVG or service URLs with custom dimensions, colors, and text instantly in your browser. No data is stored. Generates inline SVG or via.placeholder.com, placehold.co, and dummyimage.com URLs.",
    category: "image",
    subgroup: "Analysis",
    tier: ToolTier.CLIENT,
    keywords: ["placeholder", "image", "dummy", "mockup", "svg"],
    ui: {
      outputRenderer: "html",
    },
    examples: [
      {
        title: "Generate SVG Placeholder",
        description: "Generate a 400x300 placeholder image as SVG",
        input: {
          width: 400,
          height: 300,
          backgroundColor: "#e0e0e0",
          textColor: "#999999",
          format: "svg" as const,
        },
        output:
          '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">\n  <rect width="400" height="300" fill="#e0e0e0"/>\n  <text x="200" y="150" text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif" font-size="48" fill="#999999">400x300</text>\n</svg>',
      },
      {
        title: "Generate Placeholder URL",
        description: "Generate placeholder image service URLs",
        input: {
          width: 800,
          height: 600,
          text: "Hero Image",
          backgroundColor: "#3b82f6",
          textColor: "#ffffff",
          format: "url" as const,
        },
        output:
          "Placeholder Image URL\n=====================\n\nvia.placeholder.com:\n  https://via.placeholder.com/800x600/3b82f6/ffffff?text=Hero%20Image\n\nplacehold.co:\n  https://placehold.co/800x600/3b82f6/ffffff?text=Hero%20Image\n\ndummyimage.com:\n  https://dummyimage.com/800x600/3b82f6/ffffff&text=Hero%20Image",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
