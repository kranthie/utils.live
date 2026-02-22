import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to add line numbers to"),
});

const outputSchema = z.object({
  output: z.string().describe("Text with line numbers"),
  lineCount: z.number().describe("Number of lines"),
});

const optionsSchema = z.object({
  startFrom: z.number().int().default(1).describe("Starting line number"),
  separator: z.string().default(": ").describe("Separator after line number"),
  padWidth: z
    .number()
    .int()
    .min(0)
    .max(10)
    .default(0)
    .describe("Pad width (0 for auto)"),
  padChar: z.string().max(1).default(" ").describe("Padding character"),
  skipEmpty: z.boolean().default(false).describe("Skip numbering empty lines"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Adds line numbers to text.
 */
function execute(input: Input, options?: Options): Output {
  const startFrom = options?.startFrom ?? 1;
  const separator = options?.separator ?? ": ";
  const padChar = options?.padChar ?? " ";
  const skipEmpty = options?.skipEmpty ?? false;

  const lines = input.input.split(/\r?\n/);
  const maxLineNum = startFrom + lines.length - 1;
  const padWidth = options?.padWidth || String(maxLineNum).length;

  let lineNum = startFrom;
  const numbered = lines.map((line) => {
    if (skipEmpty && line.trim().length === 0) {
      return line;
    }
    const num = String(lineNum).padStart(padWidth, padChar);
    lineNum++;
    return `${num}${separator}${line}`;
  });

  return {
    output: numbered.join("\n"),
    lineCount: lines.length,
  };
}

/**
 * Line Numberer tool.
 * Adds line numbers to text.
 */
export const lineNumberer = defineTool({
  meta: {
    id: "text/line-numberer",
    name: "Line Numberer",
    description:
      "Free online line numberer — add sequential line numbers to text instantly in your browser. No data is stored. Configurable starting number, separator, padding width, and empty line handling.",
    category: "text",
    subgroup: "Transformation",
    tier: ToolTier.CLIENT,
    keywords: ["line", "number", "enumerate", "prefix"],
    examples: [
      {
        title: "Number Lines",
        description: "Add sequential line numbers to a code snippet",
        input: 'function greet() {\n  return "hello";\n}',
        output: '1: function greet() {\n2:   return "hello";\n3: }',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
