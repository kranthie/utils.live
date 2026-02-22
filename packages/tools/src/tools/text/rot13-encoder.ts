import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to encode/decode with ROT13"),
});

const outputSchema = z.object({
  output: z.string().describe("ROT13 encoded/decoded text"),
  rotatedChars: z.number().describe("Number of characters rotated"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Applies ROT13 cipher to text.
 */
function execute(input: Input): Output {
  let rotatedChars = 0;

  const output = input.input.replace(/[a-zA-Z]/g, (char) => {
    rotatedChars++;
    const base = char <= "Z" ? 65 : 97; // A or a
    return String.fromCharCode(((char.charCodeAt(0) - base + 13) % 26) + base);
  });

  return {
    output,
    rotatedChars,
  };
}

/**
 * ROT13 Encoder tool.
 * Encodes or decodes text using the ROT13 cipher.
 */
export const rot13Encoder = defineTool({
  meta: {
    id: "text/rot13-encoder",
    name: "ROT13 Encoder",
    description:
      "Free online ROT13 encoder/decoder — apply the ROT13 substitution cipher to text instantly in your browser. No data is stored. Encoding and decoding use the same operation since ROT13 is its own inverse.",
    category: "text",
    subgroup: "Transformation",
    tier: ToolTier.CLIENT,
    keywords: ["rot13", "cipher", "encode", "decode", "caesar"],
    examples: [
      {
        title: "Encode Text",
        description: "Apply the ROT13 substitution cipher to text",
        input: "Hello, World!",
        output: "Uryyb, Jbeyq!",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
