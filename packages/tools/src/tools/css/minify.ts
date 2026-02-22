import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("CSS string to minify"),
});

const outputSchema = z.object({
  output: z.string().describe("Minified CSS string"),
  originalSize: z.number().describe("Original size in bytes"),
  minifiedSize: z.number().describe("Minified size in bytes"),
  reduction: z.number().describe("Size reduction percentage"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const raw = input.input;
  if (!raw.trim()) {
    throw new Error("Input cannot be empty");
  }

  let result = raw;

  // Remove comments
  result = result.replace(/\/\*[\s\S]*?\*\//g, "");

  // Remove whitespace around special characters
  result = result.replace(/\s*([{}:;,>~+])\s*/g, "$1");

  // Remove remaining multiple spaces
  result = result.replace(/\s+/g, " ");

  // Remove leading/trailing whitespace per line
  result = result.trim();

  // Remove space after colons in properties (restore needed space in selectors)
  // Already handled above

  // Remove trailing semicolons before closing braces
  result = result.replace(/;}/g, "}");

  // Remove empty rules
  result = result.replace(/[^{}]+\{\s*\}/g, "");

  const originalSize = new TextEncoder().encode(raw).length;
  const minifiedSize = new TextEncoder().encode(result).length;
  const reduction =
    originalSize > 0
      ? Math.round(((originalSize - minifiedSize) / originalSize) * 100)
      : 0;

  return { output: result, originalSize, minifiedSize, reduction };
}

export const cssMinify = defineTool({
  meta: {
    id: "css/minify",
    name: "CSS Minify",
    description:
      "Free online CSS minifier — compress CSS by removing whitespace, comments, and unnecessary characters instantly in your browser. No data is stored. Strips trailing semicolons, empty rules, and reports size reduction percentage.",
    category: "css",
    tier: ToolTier.CLIENT,
    keywords: [
      "css",
      "minify",
      "compress",
      "optimize",
      "whitespace",
      "reduce",
      "size",
    ],
    examples: [
      {
        title: "Minify a stylesheet",
        description: "Remove whitespace and comments from CSS",
        input:
          "/* Reset */\nbody {\n  margin: 0;\n  padding: 0;\n}\n\n.container {\n  max-width: 1200px;\n}",
        output: "body{margin:0;padding:0}.container{max-width:1200px}",
      },
    ],
    ui: {
      inputLanguage: "css",
      outputLanguage: "css",
    },
  },
  inputSchema,
  outputSchema,
  execute,
});
