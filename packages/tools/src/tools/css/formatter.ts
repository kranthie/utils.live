import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("CSS string to format"),
});

const outputSchema = z.object({
  output: z.string().describe("Formatted CSS string"),
});

const optionsSchema = z.object({
  indent: z
    .number()
    .int()
    .min(1)
    .max(8)
    .default(2)
    .describe("Spaces per indent level"),
  newlineBetweenRules: z
    .boolean()
    .default(true)
    .describe("Add blank line between rule blocks"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

function execute(input: Input, options?: Options): Output {
  const raw = input.input;
  if (!raw.trim()) {
    throw new Error("Input cannot be empty");
  }

  const indentSize = options?.indent ?? 2;
  const newlineBetweenRules = options?.newlineBetweenRules ?? true;
  const indentStr = " ".repeat(indentSize);

  // Remove comments for processing, but we'll add them back
  let css = raw;

  // Normalize whitespace
  css = css.replace(/\s+/g, " ");

  const lines: string[] = [];
  let level = 0;
  let inString = false;
  let stringChar = "";
  let current = "";
  let lastWasClose = false;

  for (let i = 0; i < css.length; i++) {
    const ch = css[i];

    // Handle strings
    if (inString) {
      current += ch;
      if (ch === stringChar && css[i - 1] !== "\\") {
        inString = false;
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = true;
      stringChar = ch;
      current += ch;
      continue;
    }

    // Handle comments
    if (ch === "/" && css[i + 1] === "*") {
      const endIdx = css.indexOf("*/", i + 2);
      if (endIdx >= 0) {
        const comment = css.substring(i, endIdx + 2).trim();
        if (current.trim()) {
          lines.push(indentStr.repeat(level) + current.trim());
          current = "";
        }
        lines.push(indentStr.repeat(level) + comment);
        i = endIdx + 1;
        continue;
      }
    }

    if (ch === "{") {
      const selector = current.trim();
      if (selector) {
        if (newlineBetweenRules && lines.length > 0 && lastWasClose) {
          lines.push("");
        }
        lines.push(indentStr.repeat(level) + selector + " {");
        lastWasClose = false;
      }
      current = "";
      level++;
      continue;
    }

    if (ch === "}") {
      if (current.trim()) {
        lines.push(indentStr.repeat(level) + current.trim());
      }
      current = "";
      level = Math.max(0, level - 1);
      lines.push(indentStr.repeat(level) + "}");
      lastWasClose = true;
      continue;
    }

    if (ch === ";") {
      const decl = current.trim();
      if (decl) {
        // Normalize property: value spacing
        const colonIdx = decl.indexOf(":");
        if (colonIdx > 0) {
          const prop = decl.substring(0, colonIdx).trim();
          const val = decl.substring(colonIdx + 1).trim();
          lines.push(indentStr.repeat(level) + `${prop}: ${val};`);
        } else {
          lines.push(indentStr.repeat(level) + decl + ";");
        }
      }
      current = "";
      continue;
    }

    current += ch;
  }

  if (current.trim()) {
    lines.push(indentStr.repeat(level) + current.trim());
  }

  return { output: lines.join("\n") };
}

export const cssFormatter = defineTool({
  meta: {
    id: "css/formatter",
    name: "CSS Formatter",
    description:
      "Free online CSS formatter — prettify and indent minified CSS with proper spacing instantly in your browser. No data is stored. Configurable indentation, blank lines between rules, and comment preservation.",
    category: "css",
    tier: ToolTier.CLIENT,
    keywords: ["css", "format", "prettify", "beautify", "indent", "readable"],
    examples: [
      {
        title: "Format minified CSS",
        description: "Add proper indentation to compressed CSS",
        input:
          "body{margin:0;padding:0;}.container{max-width:1200px;margin:0 auto;}",
        output:
          '{"output":"body {\\n  margin: 0;\\n  padding: 0;\\n}\\n\\n.container {\\n  max-width: 1200px;\\n  margin: 0 auto;\\n}"}',
      },
    ],
    ui: {
      inputLanguage: "css",
      outputLanguage: "css",
    },
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
