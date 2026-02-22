import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text with empty lines to remove"),
});

const outputSchema = z.object({
  output: z.string().describe("Text with empty lines removed"),
  originalCount: z.number().describe("Original line count"),
  resultCount: z.number().describe("Result line count"),
  removedCount: z.number().describe("Number of empty lines removed"),
});

const optionsSchema = z.object({
  whitespaceOnly: z
    .boolean()
    .default(true)
    .describe("Also remove lines with only whitespace"),
  maxConsecutive: z
    .number()
    .int()
    .min(0)
    .default(0)
    .describe("Max consecutive empty lines to keep (0 = remove all)"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Removes empty lines from text.
 */
function execute(input: Input, options?: Options): Output {
  const whitespaceOnly = options?.whitespaceOnly ?? true;
  const maxConsecutive = options?.maxConsecutive ?? 0;

  const lines = input.input.split(/\r?\n/);
  const originalCount = lines.length;

  const isEmpty = (line: string): boolean => {
    return whitespaceOnly ? line.trim().length === 0 : line.length === 0;
  };

  let result: string[];

  if (maxConsecutive === 0) {
    // Remove all empty lines
    result = lines.filter((line) => !isEmpty(line));
  } else {
    // Keep up to maxConsecutive empty lines
    result = [];
    let emptyCount = 0;

    for (const line of lines) {
      if (isEmpty(line)) {
        emptyCount++;
        if (emptyCount <= maxConsecutive) {
          result.push(line);
        }
      } else {
        emptyCount = 0;
        result.push(line);
      }
    }
  }

  return {
    output: result.join("\n"),
    originalCount,
    resultCount: result.length,
    removedCount: originalCount - result.length,
  };
}

/**
 * Empty Line Remover tool.
 * Removes blank lines from text.
 */
export const emptyLineRemover = defineTool({
  meta: {
    id: "text/empty-line-remover",
    name: "Empty Line Remover",
    description:
      "Free online empty line remover — strip blank lines from text instantly in your browser. No data is stored. Options for whitespace-only lines and controlling maximum consecutive empty lines.",
    category: "text",
    subgroup: "Transformation",
    tier: ToolTier.CLIENT,
    keywords: ["empty", "blank", "lines", "remove", "trim"],
    examples: [
      {
        title: "Clean Up Text",
        description: "Remove empty lines scattered throughout a text block",
        input: "line one\n\nline two\n\n\nline three\n\nline four",
        output: "line one\nline two\nline three\nline four",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
