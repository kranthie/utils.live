import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { minifyGraphql, getByteSize, calcReduction } from "./_minify-utils";

const inputSchema = z.object({
  input: z.string().describe("GraphQL to minify"),
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
  const output = minifyGraphql(input.input);
  return {
    output,
    originalSize: getByteSize(input.input),
    minifiedSize: getByteSize(output),
    reduction: calcReduction(input.input, output),
  };
}

export const graphqlMinify = defineTool({
  meta: {
    id: "code/graphql-minify",
    name: "GraphQL Minifier",
    description:
      "Free online GraphQL minifier — compress GraphQL queries by removing whitespace and unnecessary formatting instantly in your browser. No data is stored. Shows original vs minified size with reduction percentage.",
    category: "code",
    subgroup: "Minifiers",
    tier: ToolTier.CLIENT,
    keywords: ["graphql", "minify", "compress", "reduce", "whitespace"],
    examples: [
      {
        title: "Minify a GraphQL query",
        description: "Remove whitespace from a formatted GraphQL query",
        input: "query {\n  user(id: 1) {\n    name\n    email\n  }\n}",
        output: "query{user(id:1){name email}}",
      },
    ],
    ui: { inputLanguage: "plaintext", outputLanguage: "plaintext" },
  },
  inputSchema,
  outputSchema,
  execute,
});
