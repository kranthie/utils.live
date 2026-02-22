import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { EXEC_FAILED } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("Hexadecimal string to decode to text"),
});

const outputSchema = z.object({
  output: z.string().describe("Decoded text string"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  try {
    // Remove common separators and whitespace, also strip 0x prefix
    const hex = input.input.replace(/0x/gi, "").replace(/[:\-\s]/g, "");

    if (hex.length === 0) {
      return { output: "" };
    }

    if (hex.length % 2 !== 0) {
      throw new Error("Hex string must have an even number of characters");
    }

    if (!/^[0-9a-fA-F]+$/.test(hex)) {
      throw new Error("Invalid hexadecimal characters found");
    }

    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }

    const decoder = new TextDecoder();
    return { output: decoder.decode(bytes) };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Invalid hex format";
    throw createToolError({
      code: EXEC_FAILED,
      message: `Hex decoding failed: ${msg}`,
    });
  }
}

export const hexDecode = defineTool({
  meta: {
    id: "encoding/hex-decode",
    name: "Hex Decode",
    description:
      "Free online hex decoder — convert hexadecimal strings back to readable text instantly in your browser. No data is stored. Handles 0x prefixes, colon/dash/space separators, and mixed-case hex input.",
    category: "encoding",
    subgroup: "Base Encoding",
    tier: ToolTier.CLIENT,
    keywords: ["hex", "hexadecimal", "decode", "bytes", "text"],
    examples: [
      {
        title: "Hex to Text",
        description: "Decode a hexadecimal string back to readable text",
        input: "48656c6c6f",
        output: "Hello",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
