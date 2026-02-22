import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("SVG source code to format"),
});

const optionsSchema = z.object({
  indent: z.number().min(1).max(8).default(2).describe("Indentation size"),
  indentChar: z
    .enum(["space", "tab"])
    .default("space")
    .describe("Indentation character"),
});

const outputSchema = z.object({
  output: z.string().describe("Formatted SVG source"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

function execute(input: Input, options?: Options): Output {
  const svg = input.input.trim();
  if (!svg) throw new Error("SVG input cannot be empty");

  const indentSize = options?.indent ?? 2;
  const indentChar =
    options?.indentChar === "tab" ? "\t" : " ".repeat(indentSize);

  // Simple XML pretty printer
  let formatted = "";
  let depth = 0;

  // First, normalize the input
  const normalized = svg.replace(/>\s*</g, ">\n<").replace(/\n\s*\n/g, "\n");

  const lines = normalized.split("\n");

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // Self-closing tag or closing tag
    if (line.startsWith("</")) {
      depth = Math.max(0, depth - 1);
      formatted += indentChar.repeat(depth) + line + "\n";
    } else if (line.startsWith("<?") || line.startsWith("<!")) {
      // Processing instruction or doctype
      formatted += indentChar.repeat(depth) + line + "\n";
    } else if (line.endsWith("/>")) {
      // Self-closing element
      formatted += indentChar.repeat(depth) + line + "\n";
    } else if (line.startsWith("<") && !line.includes("</")) {
      // Opening tag
      formatted += indentChar.repeat(depth) + line + "\n";
      depth++;
    } else if (line.includes("</")) {
      // Tag with content on same line
      formatted += indentChar.repeat(depth) + line + "\n";
    } else {
      formatted += indentChar.repeat(depth) + line + "\n";
    }
  }

  return { output: formatted.trimEnd() };
}

export const svgFormatter = defineTool({
  meta: {
    id: "svg/svg-formatter",
    name: "SVG Formatter",
    description:
      "Free online SVG formatter — pretty-print and indent SVG source code instantly in your browser. No data is stored. Supports configurable indentation size and tabs or spaces.",
    category: "svg",
    subgroup: "SVG Operations",
    tier: ToolTier.CLIENT,
    keywords: [
      "svg",
      "format",
      "pretty",
      "print",
      "indent",
      "prettify",
      "beautify",
      "readable",
      "xml",
    ],
    examples: [
      {
        title: "Pretty-print minified SVG circle",
        description: "Pretty-print a minified SVG with proper indentation",
        input:
          '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" fill="#FF6B6B"/></svg>',
        output:
          '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">\n  <circle cx="50" cy="50" r="40" fill="#FF6B6B"/>\n</svg>',
      },
    ],
    ui: {
      inputLanguage: "xml",
      outputLanguage: "xml",
    },
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
