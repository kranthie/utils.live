import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("SVG source code"),
});

const outputSchema = z.object({
  output: z.string().describe("Base64 encoded SVG data URL"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const svg = input.input.trim();
  if (!svg) throw new Error("SVG input cannot be empty");
  if (!svg.includes("<svg"))
    throw new Error("Input does not appear to be valid SVG");

  // Encode SVG to base64
  let base64: string;
  if (typeof Buffer !== "undefined") {
    base64 = Buffer.from(svg, "utf-8").toString("base64");
  } else {
    base64 = btoa(unescape(encodeURIComponent(svg)));
  }

  return { output: `data:image/svg+xml;base64,${base64}` };
}

export const svgToBase64 = defineTool({
  meta: {
    id: "svg/svg-to-base64",
    name: "SVG to Base64",
    description:
      "Free online SVG to Base64 converter — encode SVG source code to a base64 data URL instantly in your browser. No data is stored. Generates a ready-to-use data:image/svg+xml;base64 URI.",
    category: "svg",
    subgroup: "SVG Operations",
    tier: ToolTier.CLIENT,
    keywords: [
      "svg",
      "base64",
      "encode",
      "data-url",
      "embed",
      "inline",
      "img-src",
    ],
    examples: [
      {
        title: "Encode red circle SVG to base64 data URL",
        description: "Convert a simple SVG circle to a base64 data URL",
        input:
          '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50"><circle cx="25" cy="25" r="20" fill="red"/></svg>',
        output:
          "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCI+PGNpcmNsZSBjeD0iMjUiIGN5PSIyNSIgcj0iMjAiIGZpbGw9InJlZCIvPjwvc3ZnPg==",
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
