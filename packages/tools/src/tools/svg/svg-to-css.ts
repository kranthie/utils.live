import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("SVG source code"),
});

const optionsSchema = z.object({
  selector: z
    .string()
    .default(".icon")
    .describe("CSS selector for the element"),
  method: z
    .enum(["background-image", "mask-image", "content"])
    .default("background-image")
    .describe("CSS embedding method"),
  sizing: z
    .enum(["contain", "cover", "auto"])
    .default("contain")
    .describe("Background sizing"),
});

const outputSchema = z.object({
  output: z.string().describe("CSS code with embedded SVG"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

function execute(input: Input, options?: Options): Output {
  const svg = input.input.trim();
  if (!svg) throw new Error("SVG input cannot be empty");
  if (!svg.includes("<svg"))
    throw new Error("Input does not appear to be valid SVG");

  const selector = options?.selector ?? ".icon";
  const method = options?.method ?? "background-image";
  const sizing = options?.sizing ?? "contain";

  // Create URL-encoded data URI
  const encoded = svg
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .replace(/#/g, "%23")
    .replace(/"/g, "'")
    .replace(/</g, "%3C")
    .replace(/>/g, "%3E");

  const dataUri = `data:image/svg+xml,${encoded}`;

  let css: string;
  switch (method) {
    case "mask-image":
      css = `${selector} {
  -webkit-mask-image: url("${dataUri}");
  mask-image: url("${dataUri}");
  -webkit-mask-size: ${sizing};
  mask-size: ${sizing};
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
  background-color: currentColor;
}`;
      break;
    case "content":
      css = `${selector}::before {
  content: url("${dataUri}");
  display: inline-block;
}`;
      break;
    default:
      css = `${selector} {
  background-image: url("${dataUri}");
  background-size: ${sizing};
  background-repeat: no-repeat;
  background-position: center;
}`;
  }

  return { output: css };
}

export const svgToCss = defineTool({
  meta: {
    id: "svg/svg-to-css",
    name: "SVG to CSS",
    description:
      "Free online SVG to CSS converter — embed SVG as CSS background-image, mask-image, or content property instantly in your browser. No data is stored. Generates ready-to-use CSS with configurable selectors and sizing.",
    category: "svg",
    subgroup: "SVG Operations",
    tier: ToolTier.CLIENT,
    keywords: [
      "svg",
      "css",
      "background",
      "mask",
      "embed",
      "inline",
      "data-uri",
      "icon",
      "sprite",
    ],
    examples: [
      {
        title: "Embed circle icon as CSS background-image",
        description: "Embed a simple SVG icon as a CSS background-image",
        input:
          '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="12" cy="12" r="10" fill="#333"/></svg>',
        output:
          ".icon {\n  background-image: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Ccircle cx='12' cy='12' r='10' fill='%23333'/%3E%3C/svg%3E\");\n  background-size: contain;\n  background-repeat: no-repeat;\n  background-position: center;\n}",
      },
    ],
    ui: {
      inputLanguage: "xml",
      outputLanguage: "css",
    },
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
