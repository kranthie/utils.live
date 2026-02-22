import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { EXEC_FAILED } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("Text to convert to binary representation"),
});

const outputSchema = z.object({
  output: z.string().describe("Binary string representation"),
});

const optionsSchema = z.object({
  separator: z
    .string()
    .default(" ")
    .describe("Separator between bytes (default: space)"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

function execute(input: Input, options?: Options): Output {
  const separator = options?.separator ?? " ";

  try {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(input.input);
    const binaryParts: string[] = [];
    for (const byte of bytes) {
      binaryParts.push(byte.toString(2).padStart(8, "0"));
    }
    return { output: binaryParts.join(separator) };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to convert";
    throw createToolError({
      code: EXEC_FAILED,
      message: `Text to binary conversion failed: ${msg}`,
    });
  }
}

export const textToBinary = defineTool({
  meta: {
    id: "encoding/text-to-binary",
    name: "Text to Binary",
    description:
      "Free online text to binary converter — convert ASCII/UTF-8 text to binary 0s and 1s instantly in your browser. No data is stored. Outputs 8-bit binary per byte with customizable separators between bytes.",
    category: "encoding",
    subgroup: "Base Encoding",
    tier: ToolTier.CLIENT,
    keywords: ["binary", "text", "ascii", "encode", "bits"],
    examples: [
      {
        title: "Text to Binary",
        description: "Convert 'Hi' to its binary representation",
        input: "Hi",
        output: "01001000 01101001",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
