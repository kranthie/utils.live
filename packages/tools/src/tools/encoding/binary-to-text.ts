import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { EXEC_FAILED } from "../../core/error-codes";

const inputSchema = z.object({
  input: z
    .string()
    .describe("Binary string to convert to text (e.g., '01001000 01101001')"),
});

const outputSchema = z.object({
  output: z.string().describe("Decoded ASCII/UTF-8 text"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  try {
    // Remove separators and whitespace
    const cleaned = input.input.replace(/[\s,.\-|]/g, "");

    if (cleaned.length === 0) {
      return { output: "" };
    }

    if (!/^[01]+$/.test(cleaned)) {
      throw new Error(
        "Input must contain only 0s and 1s (with optional separators)"
      );
    }

    if (cleaned.length % 8 !== 0) {
      throw new Error("Binary string length must be a multiple of 8 bits");
    }

    const bytes = new Uint8Array(cleaned.length / 8);
    for (let i = 0; i < cleaned.length; i += 8) {
      bytes[i / 8] = parseInt(cleaned.substring(i, i + 8), 2);
    }

    const decoder = new TextDecoder();
    return { output: decoder.decode(bytes) };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Invalid binary format";
    throw createToolError({
      code: EXEC_FAILED,
      message: `Binary to text conversion failed: ${msg}`,
    });
  }
}

export const binaryToText = defineTool({
  meta: {
    id: "encoding/binary-to-text",
    name: "Binary to Text",
    description:
      "Free online binary to text converter — decode binary strings of 0s and 1s back to readable ASCII/UTF-8 text instantly in your browser. No data is stored. Accepts space-separated, comma-separated, or continuous binary input.",
    category: "encoding",
    subgroup: "Base Encoding",
    tier: ToolTier.CLIENT,
    keywords: ["binary", "text", "ascii", "decode", "bits"],
    examples: [
      {
        title: "Binary to ASCII",
        description: "Convert binary representation of 'Hi' back to text",
        input: "01001000 01101001",
        output: "Hi",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
