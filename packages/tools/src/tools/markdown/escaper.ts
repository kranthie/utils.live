import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

/**
 * All markdown special characters that may need escaping.
 */
const ALL_MARKDOWN_CHARS = [
  "\\", // Backslash (must be first for proper escaping)
  "`", // Backtick (code)
  "*", // Asterisk (bold/italic)
  "_", // Underscore (bold/italic)
  "{", // Curly brace
  "}", // Curly brace
  "[", // Square bracket (links)
  "]", // Square bracket (links)
  "<", // Angle bracket (HTML/autolinks)
  ">", // Angle bracket (blockquotes/HTML)
  "(", // Parenthesis (links)
  ")", // Parenthesis (links)
  "#", // Hash (headers)
  "+", // Plus (lists)
  "-", // Dash (lists/horizontal rules)
  ".", // Period (ordered lists)
  "!", // Exclamation (images)
  "|", // Pipe (tables)
  "~", // Tilde (strikethrough)
  "^", // Caret (superscript in some flavors)
  "=", // Equals (some heading styles)
] as const;

const inputSchema = z.object({
  input: z.string().describe("Text to escape for markdown"),
});

const outputSchema = z.object({
  output: z.string().describe("Escaped text safe for markdown"),
  escapedCount: z.number().describe("Number of characters escaped"),
});

const optionsSchema = z.object({
  characters: z
    .array(z.string())
    .optional()
    .describe(
      "Specific characters to escape (defaults to all markdown special chars)"
    ),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Escapes specified characters in text by prefixing with backslash.
 */
function escapeCharacters(
  text: string,
  chars: string[]
): { escaped: string; count: number } {
  let result = text;
  let count = 0;

  // Sort characters to ensure backslash is processed first
  const sortedChars = [...chars].sort((a, b) => {
    if (a === "\\") return -1;
    if (b === "\\") return 1;
    return 0;
  });

  for (const char of sortedChars) {
    // Count occurrences before escaping
    const regex = new RegExp(escapeRegexChar(char), "g");
    const matches = result.match(regex);
    if (matches) {
      count += matches.length;
    }

    // Escape the character
    result = result.replace(regex, `\\${char}`);
  }

  return { escaped: result, count };
}

/**
 * Escapes a character for use in regex.
 */
function escapeRegexChar(char: string): string {
  const specialRegexChars = /[.*+?^${}()|[\]\\]/;
  if (specialRegexChars.test(char)) {
    return `\\${char}`;
  }
  return char;
}

/**
 * Escapes markdown special characters in text.
 */
function execute(input: Input, options?: Options): Output {
  const charsToEscape = options?.characters ?? [...ALL_MARKDOWN_CHARS];

  // Filter to only valid single characters
  const validChars = charsToEscape.filter((c) => c.length === 1);

  const { escaped, count } = escapeCharacters(input.input, validChars);

  return {
    output: escaped,
    escapedCount: count,
  };
}

/**
 * Markdown Escaper tool.
 * Escapes special markdown characters in text.
 */
export const markdownEscaper = defineTool({
  meta: {
    id: "markdown/escaper",
    name: "Markdown Escaper",
    description:
      "Free online Markdown escaper — escape special Markdown characters like asterisks, brackets, and pipes in your text instantly in your browser. No data is stored. Prevents accidental formatting by backslash-escaping all Markdown syntax characters.",
    category: "markdown",
    subgroup: "Core",
    tier: ToolTier.CLIENT,
    keywords: ["markdown", "escape", "special", "characters", "sanitize", "md"],
    examples: [
      {
        title: "Escape markdown characters",
        description:
          "Prevent special characters from being interpreted as formatting",
        input: "Price is $10 * 2 = $20 (use **bold**)",
        output: "Price is $10 \\* 2 \\= $20 \\(use \\*\\*bold\\*\\*\\)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
