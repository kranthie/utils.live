import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Markdown content to format"),
});

const outputSchema = z.object({
  formatted: z.string().describe("Formatted Markdown"),
});

const optionsSchema = z.object({
  ensureBlankLines: z
    .boolean()
    .default(true)
    .describe("Ensure blank lines around headings and blocks"),
  normalizeHeadings: z
    .boolean()
    .default(true)
    .describe("Normalize heading markers (remove extra #)"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Normalize heading markers to proper ATX style.
 */
function normalizeHeading(line: string): string {
  const match = line.match(/^(#{1,6})\s*(.*?)\s*#*$/);
  if (match) {
    return `${match[1]} ${match[2]}`;
  }
  return line;
}

/**
 * Ensure blank lines around block elements.
 */
function ensureBlankLinesAround(lines: string[]): string[] {
  const result: string[] = [];
  const isBlockStart = (line: string): boolean => {
    return (
      /^#{1,6}\s/.test(line) || // Headings
      /^```/.test(line) || // Code blocks
      /^>\s/.test(line) || // Blockquotes (first line)
      /^[-*+]\s/.test(line) || // Unordered list items
      /^\d+\.\s/.test(line) || // Ordered list items
      /^---+$/.test(line) || // Horizontal rules
      /^\|/.test(line) // Tables
    );
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const prevLine = result[result.length - 1];
    const isCurrentBlock = isBlockStart(line);

    // Add blank line before headings if previous line is not empty
    if (/^#{1,6}\s/.test(line) && prevLine !== undefined && prevLine !== "") {
      result.push("");
    }
    // Add blank line before code blocks
    else if (/^```/.test(line) && prevLine !== undefined && prevLine !== "") {
      result.push("");
    }
    // Add blank line after previous heading if current is not empty
    else if (
      prevLine !== undefined &&
      /^#{1,6}\s/.test(prevLine) &&
      line !== "" &&
      !isCurrentBlock
    ) {
      result.push("");
    }

    result.push(line);
  }

  return result;
}

/**
 * Remove excessive blank lines (more than 2 consecutive).
 */
function normalizeBlankLines(lines: string[]): string[] {
  const result: string[] = [];
  let blankCount = 0;

  for (const line of lines) {
    if (line.trim() === "") {
      blankCount++;
      if (blankCount <= 2) {
        result.push("");
      }
    } else {
      blankCount = 0;
      result.push(line);
    }
  }

  return result;
}

/**
 * Trim trailing whitespace from lines.
 */
function trimTrailingWhitespace(lines: string[]): string[] {
  return lines.map((line) => line.trimEnd());
}

/**
 * Formats and beautifies Markdown content.
 */
function execute(input: Input, options?: Options): Output {
  const shouldEnsureBlankLines = options?.ensureBlankLines ?? true;
  const shouldNormalizeHeadings = options?.normalizeHeadings ?? true;

  let lines = input.input.split("\n");

  // Trim trailing whitespace
  lines = trimTrailingWhitespace(lines);

  // Normalize headings
  if (shouldNormalizeHeadings) {
    lines = lines.map((line) => {
      if (/^#{1,6}/.test(line)) {
        return normalizeHeading(line);
      }
      return line;
    });
  }

  // Ensure blank lines around blocks
  if (shouldEnsureBlankLines) {
    lines = ensureBlankLinesAround(lines);
  }

  // Normalize excessive blank lines
  lines = normalizeBlankLines(lines);

  // Remove leading/trailing blank lines
  while (lines.length > 0 && lines[0] === "") {
    lines.shift();
  }
  while (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }

  const formatted = lines.join("\n") + "\n";

  return { formatted };
}

/**
 * Markdown Formatter tool.
 * Formats and beautifies Markdown content with consistent spacing.
 */
export const markdownFormatter = defineTool({
  meta: {
    id: "markdown/formatter",
    name: "Markdown Formatter",
    description:
      "Free online Markdown formatter — beautify and normalize Markdown with consistent spacing, proper heading structure, and trimmed whitespace instantly in your browser. No data is stored. Ensures blank lines around headings and code blocks, removes excessive blank lines.",
    category: "markdown",
    subgroup: "Core",
    tier: ToolTier.CLIENT,
    keywords: ["markdown", "format", "beautify", "prettify", "normalize"],
    examples: [
      {
        title: "Format messy markdown",
        description: "Add proper spacing around headings and blocks",
        input: "# Title\nSome text\n## Section\nMore text",
        output:
          '{\n  "formatted": "# Title\\n\\nSome text\\n\\n## Section\\n\\nMore text\\n"\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
