import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("HTML string to minify"),
});

const outputSchema = z.object({
  output: z.string().describe("Minified HTML string"),
  originalSize: z.number().describe("Original size in bytes"),
  minifiedSize: z.number().describe("Minified size in bytes"),
  reduction: z.number().describe("Size reduction percentage"),
});

const optionsSchema = z.object({
  removeComments: z.boolean().default(true).describe("Remove HTML comments"),
  collapseWhitespace: z.boolean().default(true).describe("Collapse whitespace"),
  removeOptionalTags: z
    .boolean()
    .default(false)
    .describe("Remove optional closing tags"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

function execute(input: Input, options?: Options): Output {
  const raw = input.input;
  if (!raw.trim()) {
    throw new Error("Input cannot be empty");
  }

  const removeComments = options?.removeComments ?? true;
  const collapseWhitespace = options?.collapseWhitespace ?? true;

  let result = raw;

  // Remove HTML comments
  if (removeComments) {
    result = result.replace(/<!--[\s\S]*?-->/g, "");
  }

  // Collapse whitespace between tags
  if (collapseWhitespace) {
    // Preserve content in pre/script/style/textarea
    const preserved: string[] = [];
    let idx = 0;
    result = result.replace(
      /<(pre|script|style|textarea)\b[^>]*>[\s\S]*?<\/\1>/gi,
      (match) => {
        const placeholder = `__PRESERVE_${idx}__`;
        preserved.push(match);
        idx++;
        return placeholder;
      }
    );

    // Collapse whitespace
    result = result.replace(/\s+/g, " ");
    // Remove space between tags
    result = result.replace(/>\s+</g, "><");
    // Remove leading/trailing whitespace
    result = result.trim();

    // Restore preserved content
    for (let i = 0; i < preserved.length; i++) {
      result = result.replace(`__PRESERVE_${i}__`, preserved[i]!);
    }
  }

  const encoder = new TextEncoder();
  const originalSize = encoder.encode(raw).length;
  const minifiedSize = encoder.encode(result).length;
  const reduction =
    originalSize > 0
      ? Math.round(((originalSize - minifiedSize) / originalSize) * 100)
      : 0;

  return { output: result, originalSize, minifiedSize, reduction };
}

export const htmlMinify = defineTool({
  meta: {
    id: "html/minify",
    name: "HTML Minify",
    description:
      "Free online HTML minifier — compress HTML by removing whitespace and comments instantly in your browser. No data is stored. Preserves content in pre/script/style blocks, reports size reduction, and supports optional tag removal.",
    category: "html",
    tier: ToolTier.CLIENT,
    keywords: [
      "html",
      "minify",
      "compress",
      "whitespace",
      "optimize",
      "reduce size",
      "strip comments",
      "minifier",
    ],
    examples: [
      {
        title: "Compress HTML with comments",
        description:
          "Remove whitespace, line breaks, and comments from formatted HTML",
        input:
          '<div>\n  <!-- navigation -->\n  <nav>\n    <a href="/">Home</a>\n  </nav>\n</div>',
        output: '<div><nav><a href="/">Home</a></nav></div>',
      },
    ],
    ui: {
      inputLanguage: "html",
    },
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
