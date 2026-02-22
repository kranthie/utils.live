import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { EXEC_FAILED } from "../../core/error-codes";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

const inputSchema = z.object({
  input: z.string().describe("Text to encode or Base32 string to decode"),
});

const outputSchema = z.object({
  output: z.string().describe("Encoded or decoded result"),
});

const optionsSchema = z.object({
  mode: z
    .enum(["encode", "decode"])
    .default("encode")
    .describe("Encode text to Base32 or decode Base32 to text"),
  padding: z
    .boolean()
    .default(true)
    .describe("Include padding characters (=) in output"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

export function base32Encode(bytes: Uint8Array, padding: boolean): string {
  if (bytes.length === 0) return "";
  let bits = "";
  for (const byte of bytes) {
    bits += byte.toString(2).padStart(8, "0");
  }
  // Pad bits to multiple of 5
  while (bits.length % 5 !== 0) {
    bits += "0";
  }
  let result = "";
  for (let i = 0; i < bits.length; i += 5) {
    const index = parseInt(bits.substring(i, i + 5), 2);
    result += BASE32_ALPHABET[index];
  }
  if (padding) {
    while (result.length % 8 !== 0) {
      result += "=";
    }
  }
  return result;
}

export function base32Decode(str: string): Uint8Array {
  // Remove padding and whitespace
  const cleaned = str.replace(/=+$/, "").replace(/\s/g, "").toUpperCase();
  if (cleaned.length === 0) return new Uint8Array(0);

  for (const ch of cleaned) {
    if (!BASE32_ALPHABET.includes(ch)) {
      throw new Error(`Invalid Base32 character: '${ch}'`);
    }
  }

  let bits = "";
  for (const ch of cleaned) {
    const index = BASE32_ALPHABET.indexOf(ch);
    bits += index.toString(2).padStart(5, "0");
  }
  // Trim trailing bits that don't form a full byte
  const byteCount = Math.floor(bits.length / 8);
  const bytes = new Uint8Array(byteCount);
  for (let i = 0; i < byteCount; i++) {
    bytes[i] = parseInt(bits.substring(i * 8, i * 8 + 8), 2);
  }
  return bytes;
}

function execute(input: Input, options?: Options): Output {
  const mode = options?.mode ?? "encode";
  const padding = options?.padding ?? true;

  try {
    if (mode === "encode") {
      const encoder = new TextEncoder();
      const bytes = encoder.encode(input.input);
      return { output: base32Encode(bytes, padding) };
    } else {
      const bytes = base32Decode(input.input);
      const decoder = new TextDecoder();
      return { output: decoder.decode(bytes) };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Base32 operation failed";
    throw createToolError({
      code: EXEC_FAILED,
      message: `Base32 ${mode} failed: ${msg}`,
    });
  }
}

export const base32EncodeDecode = defineTool({
  meta: {
    id: "encoding/base32-encode-decode",
    name: "Base32 Encode/Decode",
    description:
      "Free online Base32 encoder/decoder — encode text to Base32 or decode Base32 back to text instantly in your browser. No data is stored. Supports RFC 4648 standard with optional padding characters.",
    category: "encoding",
    subgroup: "Base Encoding",
    tier: ToolTier.CLIENT,
    keywords: ["base32", "encode", "decode", "rfc4648"],
    examples: [
      {
        title: "Encode Text",
        description: "Encode a greeting to Base32",
        input: "Hello, World!",
        output: "JBSWY3DPFQQFO33SNRSCC===",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
