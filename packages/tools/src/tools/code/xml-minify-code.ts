import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { minifyXml, getByteSize, calcReduction } from "./_minify-utils";

const inputSchema = z.object({ input: z.string().describe("XML to minify") });
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
  const output = minifyXml(input.input);
  return {
    output,
    originalSize: getByteSize(input.input),
    minifiedSize: getByteSize(output),
    reduction: calcReduction(input.input, output),
  };
}

export const xmlMinifyCode = defineTool({
  meta: {
    id: "code/xml-minify-code",
    name: "XML Minifier",
    description:
      "Free online XML minifier — compress XML by removing whitespace, comments, and unnecessary formatting instantly in your browser. No data is stored. Shows original vs minified size with reduction percentage.",
    category: "code",
    subgroup: "Minifiers",
    tier: ToolTier.CLIENT,
    keywords: ["xml", "minify", "compress", "reduce", "whitespace", "compact"],
    examples: [
      {
        title: "Minify XML",
        description: "Remove whitespace and comments from XML",
        input:
          "<root>\n  <!-- Config -->\n  <item>\n    <name>Test</name>\n  </item>\n</root>",
        output: "<root><item><name>Test</name></item></root>",
      },
    ],
    ui: { inputLanguage: "xml", outputLanguage: "xml" },
  },
  inputSchema,
  outputSchema,
  execute,
});
