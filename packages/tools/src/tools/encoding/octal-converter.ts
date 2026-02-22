import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { EXEC_FAILED } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("Text to encode or octal string to decode"),
});

const outputSchema = z.object({
  output: z.string().describe("Encoded or decoded result"),
});

const optionsSchema = z.object({
  mode: z
    .enum(["encode", "decode"])
    .default("encode")
    .describe("Encode text to octal or decode octal to text"),
  separator: z
    .string()
    .default(" ")
    .describe("Separator between octal values (default: space)"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

function execute(input: Input, options?: Options): Output {
  const mode = options?.mode ?? "encode";
  const separator = options?.separator ?? " ";

  try {
    if (mode === "encode") {
      const encoder = new TextEncoder();
      const bytes = encoder.encode(input.input);
      const octalParts: string[] = [];
      for (const byte of bytes) {
        octalParts.push(byte.toString(8).padStart(3, "0"));
      }
      return { output: octalParts.join(separator) };
    } else {
      // Decode: split by whitespace or common separators
      const parts = input.input
        .trim()
        .split(/[\s,]+/)
        .filter(Boolean);
      if (parts.length === 0) {
        return { output: "" };
      }
      const bytes = new Uint8Array(parts.length);
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]!;
        if (!/^[0-7]+$/.test(part)) {
          throw new Error(`Invalid octal value: '${part}'`);
        }
        const val = parseInt(part, 8);
        if (val > 255) {
          throw new Error(`Octal value out of byte range: '${part}'`);
        }
        bytes[i] = val;
      }
      const decoder = new TextDecoder();
      return { output: decoder.decode(bytes) };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Octal operation failed";
    throw createToolError({
      code: EXEC_FAILED,
      message: `Octal ${mode} failed: ${msg}`,
    });
  }
}

export const octalConverter = defineTool({
  meta: {
    id: "encoding/octal-converter",
    name: "Octal Converter",
    description:
      "Free online octal converter — encode text to octal byte values or decode octal back to text instantly in your browser. No data is stored. Supports customizable separators and handles UTF-8 multi-byte characters.",
    category: "encoding",
    subgroup: "Base Encoding",
    tier: ToolTier.CLIENT,
    keywords: ["octal", "encode", "decode", "base8", "text"],
    examples: [
      {
        title: "Text to Octal",
        description: "Convert 'Hi' to octal byte values",
        input: "Hi",
        output: "110 151",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
