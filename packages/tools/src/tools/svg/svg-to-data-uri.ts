import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("SVG source code"),
});

const outputSchema = z.object({
  output: z.string().describe("URL-encoded SVG data URI"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const svg = input.input.trim();
  if (!svg) throw new Error("SVG input cannot be empty");
  if (!svg.includes("<svg"))
    throw new Error("Input does not appear to be valid SVG");

  // URL encode the SVG (more efficient than base64 for SVG)
  const encoded = svg
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .replace(/#/g, "%23")
    .replace(/"/g, "'")
    .replace(/</g, "%3C")
    .replace(/>/g, "%3E")
    .replace(/{/g, "%7B")
    .replace(/}/g, "%7D");

  return { output: `data:image/svg+xml,${encoded}` };
}

export const svgToDataUri = defineTool({
  meta: {
    id: "svg/svg-to-data-uri",
    name: "SVG to Data URI",
    description:
      "Free online SVG to data URI converter — create URL-encoded SVG data URIs that are more efficient than base64 instantly in your browser. No data is stored. Generates a ready-to-use data:image/svg+xml URI with minimal encoding.",
    category: "svg",
    subgroup: "SVG Operations",
    tier: ToolTier.CLIENT,
    keywords: [
      "svg",
      "data-uri",
      "url",
      "encode",
      "embed",
      "percent-encode",
      "inline",
      "img-src",
    ],
    examples: [
      {
        title: "URL-encode blue rectangle as data URI",
        description: "Convert an SVG rectangle to a URL-encoded data URI",
        input:
          '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#3498DB"/></svg>',
        output:
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%233498DB'/%3E%3C/svg%3E",
      },
    ],
    ui: {
      inputLanguage: "xml",
    },
  },
  inputSchema,
  outputSchema,
  execute,
});
