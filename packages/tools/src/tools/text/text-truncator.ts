import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to truncate"),
});

const outputSchema = z.object({
  output: z.string().describe("Truncated text"),
  truncated: z.boolean().describe("Whether text was truncated"),
  originalLength: z.number().describe("Original length"),
  resultLength: z.number().describe("Result length"),
});

const optionsSchema = z.object({
  maxLength: z.number().int().min(1).default(100).describe("Maximum length"),
  suffix: z.string().default("...").describe("Suffix to add when truncated"),
  preserveWords: z.boolean().default(true).describe("Preserve word boundaries"),
  position: z
    .enum(["end", "middle", "start"])
    .default("end")
    .describe("Where to truncate"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Truncates text with smart options.
 */
function execute(input: Input, options?: Options): Output {
  const maxLength = options?.maxLength ?? 100;
  const suffix = options?.suffix ?? "...";
  const preserveWords = options?.preserveWords ?? true;
  const position = options?.position ?? "end";

  const text = input.input;
  const originalLength = text.length;

  if (text.length <= maxLength) {
    return {
      output: text,
      truncated: false,
      originalLength,
      resultLength: text.length,
    };
  }

  let output: string;
  const availableLength = maxLength - suffix.length;

  if (availableLength <= 0) {
    output = suffix.slice(0, maxLength);
  } else {
    switch (position) {
      case "start": {
        let result = text.slice(-availableLength);
        if (preserveWords) {
          const spaceIndex = result.indexOf(" ");
          if (spaceIndex > 0 && spaceIndex < result.length / 2) {
            result = result.slice(spaceIndex + 1);
          }
        }
        output = suffix + result;
        break;
      }
      case "middle": {
        const halfLength = Math.floor(availableLength / 2);
        const start = text.slice(0, halfLength);
        const end = text.slice(-halfLength);

        let trimmedStart = start;
        let trimmedEnd = end;

        if (preserveWords) {
          const startSpaceIndex = start.lastIndexOf(" ");
          if (startSpaceIndex > halfLength / 2) {
            trimmedStart = start.slice(0, startSpaceIndex);
          }
          const endSpaceIndex = end.indexOf(" ");
          if (endSpaceIndex > 0 && endSpaceIndex < halfLength / 2) {
            trimmedEnd = end.slice(endSpaceIndex + 1);
          }
        }

        output = trimmedStart + suffix + trimmedEnd;
        break;
      }
      case "end":
      default: {
        let result = text.slice(0, availableLength);
        if (preserveWords) {
          const lastSpaceIndex = result.lastIndexOf(" ");
          if (lastSpaceIndex > availableLength / 2) {
            result = result.slice(0, lastSpaceIndex);
          }
        }
        output = result + suffix;
      }
    }
  }

  return {
    output,
    truncated: true,
    originalLength,
    resultLength: output.length,
  };
}

/**
 * Text Truncator tool.
 * Smart truncation with ellipsis.
 */
export const textTruncator = defineTool({
  meta: {
    id: "text/truncator",
    name: "Text Truncator",
    description:
      "Free online text truncator — shorten text to a maximum length with ellipsis instantly in your browser. No data is stored. Supports word-boundary preservation and start/middle/end truncation positions.",
    category: "text",
    subgroup: "Transformation",
    tier: ToolTier.CLIENT,
    keywords: ["truncate", "shorten", "ellipsis", "limit", "length"],
    examples: [
      {
        title: "Truncate a long sentence",
        description: "Shorten text to a maximum length with ellipsis",
        input: "The quick brown fox jumps over the lazy dog in the garden",
        output: "The quick brown fox jumps over the lazy dog in the garden",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
