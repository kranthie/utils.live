import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to reverse"),
});

const outputSchema = z.object({
  characters: z.string().describe("Characters reversed"),
  words: z.string().describe("Words reversed (order)"),
  lines: z.string().describe("Lines reversed (order)"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Reverses text in multiple ways.
 */
function execute(input: Input): Output {
  const text = input.input;

  // Reverse characters (handle Unicode properly using spread)
  const characters = [...text].reverse().join("");

  // Reverse word order while preserving words
  const words = text.split(/(\s+)/).filter(Boolean).reverse().join("");

  // Reverse line order
  const lines = text.split(/\r?\n/).reverse().join("\n");

  return {
    characters,
    words,
    lines,
  };
}

/**
 * Text Reverser tool.
 * Reverses text, words, or lines.
 */
export const textReverser = defineTool({
  meta: {
    id: "text/reverser",
    name: "Text Reverser",
    description:
      "Free online text reverser — reverse characters, word order, or line order instantly in your browser. No data is stored. Outputs all three reversal modes simultaneously with proper Unicode support.",
    category: "text",
    subgroup: "Transformation",
    tier: ToolTier.CLIENT,
    keywords: ["reverse", "flip", "backwards", "mirror"],
    examples: [
      {
        title: "Reverse Characters",
        description: "Reverse all characters in a string",
        input: "Hello, World!",
        output:
          '{"characters":"!dlroW ,olleH","words":"World! Hello,","lines":"Hello, World!"}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
