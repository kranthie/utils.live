import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("JavaScript code to format"),
});

const outputSchema = z.object({
  output: z.string().describe("Formatted JavaScript code"),
});

const optionsSchema = z.object({
  indent: z
    .number()
    .int()
    .min(1)
    .max(8)
    .default(2)
    .describe("Spaces per indent level"),
  semicolons: z.boolean().default(true).describe("Ensure semicolons"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

function formatCLikeCode(code: string, indentSize: number): string {
  const indentStr = " ".repeat(indentSize);
  const lines: string[] = [];
  let level = 0;

  // Normalize whitespace
  let normalized = code.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Add newlines after braces and semicolons
  normalized = normalized.replace(/\{/g, " {\n");
  normalized = normalized.replace(/\}/g, "\n}\n");
  normalized = normalized.replace(/;(?!\s*\/\/)/g, ";\n");

  const rawLines = normalized.split("\n");

  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    // Decrease indent for closing braces
    if (trimmed.startsWith("}") || trimmed.startsWith("]")) {
      level = Math.max(0, level - 1);
    }

    lines.push(indentStr.repeat(level) + trimmed);

    // Increase indent after opening braces
    if (trimmed.endsWith("{") || trimmed.endsWith("[")) {
      level++;
    }
  }

  return lines.join("\n");
}

function execute(input: Input, options?: Options): Output {
  const raw = input.input;
  if (!raw.trim()) {
    throw new Error("Input cannot be empty");
  }

  const indentSize = options?.indent ?? 2;
  const output = formatCLikeCode(raw, indentSize);

  return { output };
}

export const jsFormatter = defineTool({
  meta: {
    id: "code/js-formatter",
    name: "JavaScript Formatter",
    description:
      "Free online JavaScript formatter — format and indent JavaScript code based on brace and bracket structure instantly in your browser. No data is stored. Basic formatter with configurable indent size — for production use, consider Prettier.",
    category: "code",
    subgroup: "Formatters",
    tier: ToolTier.CLIENT,
    keywords: ["javascript", "js", "format", "prettify", "beautify", "indent"],
    examples: [
      {
        title: "Format minified JavaScript",
        description: "Add indentation to compressed JavaScript code",
        input:
          "function greet(name){if(name){console.log('Hello '+name);}else{console.log('Hello World');}}",
        output:
          "function greet(name) {\n  if(name) {\n    console.log('Hello '+name);\n  }\n  else {\n    console.log('Hello World');\n  }\n}",
      },
    ],
    ui: {
      inputLanguage: "javascript",
      outputLanguage: "javascript",
    },
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
