import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { minifyCLikeCode, getByteSize, calcReduction } from "./_minify-utils";

const inputSchema = z.object({
  input: z.string().describe("TypeScript code to minify"),
});
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

  let result = input.input;
  // Remove type annotations (basic approach)
  // Remove `: Type` after parameters
  result = result.replace(
    /:\s*(?:string|number|boolean|void|any|never|unknown|null|undefined|object)\b/g,
    ""
  );
  // Remove interface/type declarations
  result = result.replace(
    /(?:export\s+)?(?:interface|type)\s+\w+\s*(?:<[^>]*>)?\s*(?:extends\s+\w+\s*)?{[^}]*}/g,
    ""
  );
  // Remove generic type params after identifiers (e.g. Array<T>, function foo<T>)
  // Lookbehind ensures we only match generics following a word char, not comparison operators
  result = result.replace(
    /(?<=[a-zA-Z_$\d])<\s*\w+(?:\[\])*(?:\s*[|&]\s*\w+(?:\[\])*)*(?:\s*,\s*\w+(?:\[\])*(?:\s*[|&]\s*\w+(?:\[\])*)*)*\s*>/g,
    ""
  );
  // Remove `as Type` casts
  result = result.replace(/\s+as\s+\w+/g, "");

  const output = minifyCLikeCode(result);
  return {
    output,
    originalSize: getByteSize(input.input),
    minifiedSize: getByteSize(output),
    reduction: calcReduction(input.input, output),
  };
}

export const tsMinify = defineTool({
  meta: {
    id: "code/ts-minify",
    name: "TypeScript Minifier",
    description:
      "Free online TypeScript minifier — remove type annotations, interfaces, generics, and whitespace to produce minified JavaScript instantly in your browser. No data is stored. Shows original vs minified size with reduction percentage.",
    category: "code",
    subgroup: "Minifiers",
    tier: ToolTier.CLIENT,
    keywords: [
      "typescript",
      "ts",
      "minify",
      "compress",
      "reduce",
      "whitespace",
    ],
    examples: [
      {
        title: "Minify TypeScript",
        description: "Remove types and whitespace from TypeScript code",
        input:
          "function add(a: number, b: number): number {\n  return a + b;\n}",
        output: "function add(a,b){return a+b;}",
      },
    ],
    ui: { inputLanguage: "typescript", outputLanguage: "javascript" },
  },
  inputSchema,
  outputSchema,
  execute,
});
