import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Markdown text to format"),
});

const outputSchema = z.object({
  output: z.string().describe("Formatted Markdown text"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const raw = input.input;
  if (!raw.trim()) {
    throw new Error("Input cannot be empty");
  }

  let result = raw;

  // Normalize line endings
  result = result.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Ensure blank line before headings
  result = result.replace(/([^\n])\n(#{1,6}\s)/g, "$1\n\n$2");

  // Ensure space after # in headings
  result = result.replace(/^(#{1,6})([^\s#])/gm, "$1 $2");

  // Ensure blank line before and after code blocks
  result = result.replace(/([^\n])\n(```)/g, "$1\n\n$2");
  result = result.replace(/(```)\n([^\n])/g, "$1\n\n$2");

  // Ensure blank line before lists
  result = result.replace(/([^\n])\n([-*+]\s|\d+\.\s)/g, "$1\n\n$2");

  // Remove trailing whitespace
  result = result.replace(/[ \t]+$/gm, "");

  // Normalize multiple blank lines to max 2
  result = result.replace(/\n{4,}/g, "\n\n\n");

  // Ensure file ends with single newline
  result = result.trimEnd() + "\n";

  return { output: result };
}

export const mdFormatter = defineTool({
  meta: {
    id: "code/md-formatter",
    name: "Markdown Formatter",
    description:
      "Free online Markdown formatter — normalize spacing, add blank lines before headings and lists, trim trailing whitespace, and fix structure instantly in your browser. No data is stored.",
    category: "code",
    subgroup: "Formatters",
    tier: ToolTier.CLIENT,
    keywords: [
      "markdown",
      "md",
      "format",
      "prettify",
      "normalize",
      "spacing",
      "structure",
    ],
    examples: [
      {
        title: "Fix Markdown spacing",
        description: "Add proper blank lines before headings and lists",
        input: "# Title\nSome text.\n## Section\n- Item 1\n- Item 2",
        output: "# Title\nSome text.\n\n## Section\n\n- Item 1\n\n- Item 2\n",
      },
    ],
    ui: {
      inputLanguage: "markdown",
      outputLanguage: "markdown",
    },
  },
  inputSchema,
  outputSchema,
  execute,
});
