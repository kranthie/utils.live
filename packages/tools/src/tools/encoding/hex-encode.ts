import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { EXEC_FAILED } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("Text to convert to hexadecimal"),
});

const outputSchema = z.object({
  output: z.string().describe("Hexadecimal encoded string"),
});

const optionsSchema = z.object({
  uppercase: z
    .boolean()
    .default(false)
    .describe("Output uppercase hex characters"),
  separator: z
    .string()
    .default("")
    .describe("Separator between hex bytes (e.g., ' ', ':', '-')"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

function execute(input: Input, options?: Options): Output {
  const uppercase = options?.uppercase ?? false;
  const separator = options?.separator ?? "";

  try {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(input.input);
    const hexParts: string[] = [];
    for (const byte of bytes) {
      const hex = byte.toString(16).padStart(2, "0");
      hexParts.push(uppercase ? hex.toUpperCase() : hex);
    }
    return { output: hexParts.join(separator) };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to encode";
    throw createToolError({
      code: EXEC_FAILED,
      message: `Hex encoding failed: ${msg}`,
    });
  }
}

export const hexEncode = defineTool({
  meta: {
    id: "encoding/hex-encode",
    name: "Hex Encode",
    description:
      "Free online hex encoder — convert text to hexadecimal byte representation instantly in your browser. No data is stored. Supports uppercase/lowercase output and customizable byte separators (space, colon, dash).",
    category: "encoding",
    subgroup: "Base Encoding",
    tier: ToolTier.CLIENT,
    keywords: ["hex", "hexadecimal", "encode", "bytes", "text"],
    examples: [
      {
        title: "Simple Text",
        description:
          "Convert ASCII text to its hexadecimal byte representation",
        input: "Hello",
        output: "48656c6c6f",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
