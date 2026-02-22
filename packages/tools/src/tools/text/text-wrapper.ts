import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to wrap"),
});

const outputSchema = z.object({
  output: z.string().describe("Wrapped text"),
  lineCount: z.number().describe("Number of lines after wrapping"),
});

const optionsSchema = z.object({
  width: z.number().int().min(10).max(200).default(80).describe("Line width"),
  breakWords: z.boolean().default(false).describe("Break words at boundary"),
  preserveParagraphs: z
    .boolean()
    .default(true)
    .describe("Preserve paragraph breaks"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

function wrapLine(line: string, width: number, breakWords: boolean): string[] {
  if (line.length <= width) {
    return [line];
  }

  const result: string[] = [];
  let current = "";

  const words = line.split(/(\s+)/);

  for (const word of words) {
    if (!word) continue;

    // Check if this is whitespace
    if (/^\s+$/.test(word)) {
      if (current.length + word.length <= width) {
        current += word;
      }
      continue;
    }

    if (current.length === 0) {
      // Starting a new line
      if (word.length > width && breakWords) {
        // Break the word
        let remaining = word;
        while (remaining.length > width) {
          result.push(remaining.slice(0, width));
          remaining = remaining.slice(width);
        }
        current = remaining;
      } else {
        current = word;
      }
    } else if (current.length + word.length <= width) {
      // Word fits
      current += word;
    } else {
      // Word doesn't fit, start new line
      result.push(current.trimEnd());
      if (word.length > width && breakWords) {
        let remaining = word;
        while (remaining.length > width) {
          result.push(remaining.slice(0, width));
          remaining = remaining.slice(width);
        }
        current = remaining;
      } else {
        current = word;
      }
    }
  }

  if (current.length > 0) {
    result.push(current.trimEnd());
  }

  return result;
}

/**
 * Wraps text at specified width.
 */
function execute(input: Input, options?: Options): Output {
  const width = options?.width ?? 80;
  const breakWords = options?.breakWords ?? false;
  const preserveParagraphs = options?.preserveParagraphs ?? true;

  let text = input.input;

  if (preserveParagraphs) {
    // Split by double newlines (paragraphs)
    const paragraphs = text.split(/\n\n+/);
    const wrappedParagraphs = paragraphs.map((para) => {
      // Join single newlines in a paragraph
      const joined = para.replace(/\n/g, " ");
      return wrapLine(joined, width, breakWords).join("\n");
    });
    text = wrappedParagraphs.join("\n\n");
  } else {
    // Process all lines
    const lines = text.split(/\n/);
    const wrapped = lines.flatMap((line) => wrapLine(line, width, breakWords));
    text = wrapped.join("\n");
  }

  return {
    output: text,
    lineCount: text.split("\n").length,
  };
}

/**
 * Text Wrapper tool.
 * Wraps text at specified width.
 */
export const textWrapper = defineTool({
  meta: {
    id: "text/wrapper",
    name: "Text Wrapper",
    description:
      "Free online text wrapper — wrap text at a specified column width instantly in your browser. No data is stored. Configurable line width (10-200), word break mode, and paragraph preservation.",
    category: "text",
    subgroup: "Transformation",
    tier: ToolTier.CLIENT,
    keywords: ["wrap", "width", "column", "line", "break"],
    examples: [
      {
        title: "Wrap a long paragraph",
        description:
          "Break a long paragraph into lines at the default 80-character width",
        input:
          "The quick brown fox jumps over the lazy dog in the beautiful garden on a sunny afternoon. The birds were singing and the flowers were blooming all around the park.",
        output:
          "The quick brown fox jumps over the lazy dog in the beautiful garden on a sunny\nafternoon. The birds were singing and the flowers were blooming all around the\npark.",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
