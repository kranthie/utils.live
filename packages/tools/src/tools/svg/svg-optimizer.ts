import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("SVG source code to optimize"),
});

const optionsSchema = z.object({
  removeComments: z.boolean().default(true).describe("Remove XML comments"),
  removeMetadata: z
    .boolean()
    .default(true)
    .describe("Remove metadata elements"),
  removeEmptyAttrs: z
    .boolean()
    .default(true)
    .describe("Remove empty attributes"),
  removeHiddenElements: z
    .boolean()
    .default(true)
    .describe("Remove hidden/invisible elements"),
  collapseWhitespace: z.boolean().default(true).describe("Collapse whitespace"),
  shortenColors: z
    .boolean()
    .default(true)
    .describe("Shorten hex colors (e.g., #ffffff -> #fff)"),
  removeXmlDecl: z.boolean().default(true).describe("Remove XML declaration"),
});

const outputSchema = z.object({
  output: z.string().describe("Optimized SVG source"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

function execute(input: Input, options?: Options): Output {
  let svg = input.input.trim();
  if (!svg) throw new Error("SVG input cannot be empty");
  if (!svg.includes("<svg"))
    throw new Error("Input does not appear to be valid SVG");

  const opts = {
    removeComments: options?.removeComments ?? true,
    removeMetadata: options?.removeMetadata ?? true,
    removeEmptyAttrs: options?.removeEmptyAttrs ?? true,
    removeHiddenElements: options?.removeHiddenElements ?? true,
    collapseWhitespace: options?.collapseWhitespace ?? true,
    shortenColors: options?.shortenColors ?? true,
    removeXmlDecl: options?.removeXmlDecl ?? true,
  };

  // Remove XML declaration
  if (opts.removeXmlDecl) {
    svg = svg.replace(/<\?xml[^?]*\?>\s*/g, "");
  }

  // Remove comments
  if (opts.removeComments) {
    svg = svg.replace(/<!--[\s\S]*?-->/g, "");
  }

  // Remove metadata elements
  if (opts.removeMetadata) {
    svg = svg.replace(/<metadata[\s\S]*?<\/metadata>/gi, "");
    svg = svg.replace(/<desc[\s\S]*?<\/desc>/gi, "");
    svg = svg.replace(/<title[\s\S]*?<\/title>/gi, "");
  }

  // Remove empty attributes
  if (opts.removeEmptyAttrs) {
    svg = svg.replace(/\s+\w+=""/g, "");
  }

  // Remove hidden elements
  if (opts.removeHiddenElements) {
    svg = svg.replace(
      /<[^>]+display\s*=\s*"none"[^>]*>[\s\S]*?<\/[^>]+>/gi,
      ""
    );
    svg = svg.replace(
      /<[^>]+visibility\s*=\s*"hidden"[^>]*>[\s\S]*?<\/[^>]+>/gi,
      ""
    );
  }

  // Shorten colors
  if (opts.shortenColors) {
    svg = svg.replace(
      /#([0-9a-fA-F])\1([0-9a-fA-F])\2([0-9a-fA-F])\3/g,
      "#$1$2$3"
    );
  }

  // Collapse whitespace
  if (opts.collapseWhitespace) {
    svg = svg.replace(/\s+/g, " ");
    svg = svg.replace(/>\s+</g, "><");
    svg = svg.replace(/\s+\/>/g, "/>");
    svg = svg.replace(/\s+>/g, ">");
  }

  return { output: svg.trim() };
}

export const svgOptimizer = defineTool({
  meta: {
    id: "svg/svg-optimizer",
    name: "SVG Optimizer",
    description:
      "Free online SVG optimizer — reduce SVG file size by removing comments, metadata, whitespace, and shortening colors instantly in your browser. No data is stored. Configurable options for each optimization pass.",
    category: "svg",
    subgroup: "SVG Operations",
    tier: ToolTier.CLIENT,
    keywords: [
      "svg",
      "optimize",
      "minify",
      "clean",
      "reduce",
      "svgo",
      "compress",
      "file-size",
      "performance",
    ],
    examples: [
      {
        title: "Strip XML declaration, comments, and shorten colors",
        description: "Remove comments, whitespace, and shorten colors in SVG",
        input:
          '<?xml version="1.0"?>\n<!-- A red circle -->\n<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">\n  <circle cx="50" cy="50" r="40" fill="#ff0000"/>\n</svg>',
        output:
          '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" fill="#f00"/></svg>',
      },
    ],
    ui: {
      inputLanguage: "xml",
      outputLanguage: "xml",
    },
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
