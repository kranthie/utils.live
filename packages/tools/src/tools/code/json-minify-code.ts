import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { minifyJson, getByteSize, calcReduction } from "./_minify-utils";

const inputSchema = z.object({ input: z.string().describe("JSON to minify") });
const outputSchema = z.object({
  output: z.string(),
  originalSize: z.number(),
  minifiedSize: z.number(),
  reduction: z.number(),
});

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  if (!input.input.trim()) throw new Error("Input cannot be empty");
  try {
    const output = minifyJson(input.input);
    return {
      output,
      originalSize: getByteSize(input.input),
      minifiedSize: getByteSize(output),
      reduction: calcReduction(input.input, output),
    };
  } catch (e) {
    throw new Error(`Invalid JSON: ${(e as Error).message}`);
  }
}

export const jsonMinifyCode = defineTool({
  meta: {
    id: "code/json-minify-code",
    name: "JSON Minifier",
    description:
      "Free online JSON minifier — compress JSON by removing all whitespace and formatting instantly in your browser. No data is stored. Shows original vs minified size with reduction percentage.",
    category: "code",
    subgroup: "Minifiers",
    tier: ToolTier.CLIENT,
    keywords: ["json", "minify", "compress", "reduce", "whitespace", "compact"],
    examples: [
      {
        title: "Minify JSON",
        description: "Remove whitespace from formatted JSON",
        input:
          '{\n  "name": "my-app",\n  "version": "1.0.0",\n  "private": true\n}',
        output: '{"name":"my-app","version":"1.0.0","private":true}',
      },
    ],
    ui: { inputLanguage: "json", outputLanguage: "json" },
  },
  inputSchema,
  outputSchema,
  execute,
});
