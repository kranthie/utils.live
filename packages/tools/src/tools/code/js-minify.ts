import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { minifyCLikeCode, getByteSize, calcReduction } from "./_minify-utils";

const inputSchema = z.object({
  input: z.string().describe("JavaScript code to minify"),
});
const outputSchema = z.object({
  output: z.string().describe("Minified JavaScript"),
  originalSize: z.number(),
  minifiedSize: z.number(),
  reduction: z.number(),
});

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  if (!input.input.trim()) throw new Error("Input cannot be empty");
  const output = minifyCLikeCode(input.input);
  return {
    output,
    originalSize: getByteSize(input.input),
    minifiedSize: getByteSize(output),
    reduction: calcReduction(input.input, output),
  };
}

export const jsMinify = defineTool({
  meta: {
    id: "code/js-minify",
    name: "JavaScript Minifier",
    description:
      "Free online JavaScript minifier — compress JavaScript code by removing whitespace and comments instantly in your browser. No data is stored. Shows original vs minified size with reduction percentage.",
    category: "code",
    subgroup: "Minifiers",
    tier: ToolTier.CLIENT,
    keywords: ["javascript", "js", "minify", "compress", "optimize"],
    examples: [
      {
        title: "Minify JavaScript",
        description: "Remove whitespace and comments from JavaScript code",
        input:
          "// Utility function\nfunction add(a, b) {\n  return a + b;\n}\n\nconst result = add(2, 3);",
        output: "function add(a,b){return a+b;}const result=add(2,3);",
      },
    ],
    ui: { inputLanguage: "javascript", outputLanguage: "javascript" },
  },
  inputSchema,
  outputSchema,
  execute,
});
