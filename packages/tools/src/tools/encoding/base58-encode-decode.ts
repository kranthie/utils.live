import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { EXEC_FAILED } from "../../core/error-codes";

const BASE58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

const inputSchema = z.object({
  input: z.string().describe("Text to encode or Base58 string to decode"),
});

const outputSchema = z.object({
  output: z.string().describe("Encoded or decoded result"),
});

const optionsSchema = z.object({
  mode: z
    .enum(["encode", "decode"])
    .default("encode")
    .describe("Encode text to Base58 or decode Base58 to text"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

export function base58Encode(bytes: Uint8Array): string {
  if (bytes.length === 0) return "";

  // Count leading zeros
  let leadingZeros = 0;
  for (const b of bytes) {
    if (b === 0) leadingZeros++;
    else break;
  }

  // Convert bytes to a big integer using BigInt
  let num = BigInt(0);
  for (const b of bytes) {
    num = num * BigInt(256) + BigInt(b);
  }

  let result = "";
  while (num > BigInt(0)) {
    const remainder = Number(num % BigInt(58));
    num = num / BigInt(58);
    result = BASE58_ALPHABET[remainder] + result;
  }

  // Add leading '1's for each leading zero byte
  const leadChar = BASE58_ALPHABET[0] ?? "1";
  return leadChar.repeat(leadingZeros) + result;
}

export function base58Decode(str: string): Uint8Array {
  if (str.length === 0) return new Uint8Array(0);

  for (const ch of str) {
    if (!BASE58_ALPHABET.includes(ch)) {
      throw new Error(`Invalid Base58 character: '${ch}'`);
    }
  }

  // Count leading '1's (represent zero bytes)
  let leadingOnes = 0;
  for (const ch of str) {
    if (ch === "1") leadingOnes++;
    else break;
  }

  let num = BigInt(0);
  for (const ch of str) {
    num = num * BigInt(58) + BigInt(BASE58_ALPHABET.indexOf(ch));
  }

  // Convert BigInt to bytes
  const hexStr = num === BigInt(0) ? "" : num.toString(16);
  const paddedHex = hexStr.length % 2 ? "0" + hexStr : hexStr;
  const byteLength = paddedHex.length / 2;
  const bytes = new Uint8Array(leadingOnes + byteLength);

  for (let i = 0; i < byteLength; i++) {
    bytes[leadingOnes + i] = parseInt(
      paddedHex.substring(i * 2, i * 2 + 2),
      16
    );
  }

  return bytes;
}

function execute(input: Input, options?: Options): Output {
  const mode = options?.mode ?? "encode";

  try {
    if (mode === "encode") {
      const encoder = new TextEncoder();
      const bytes = encoder.encode(input.input);
      return { output: base58Encode(bytes) };
    } else {
      const bytes = base58Decode(input.input);
      const decoder = new TextDecoder();
      return { output: decoder.decode(bytes) };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Base58 operation failed";
    throw createToolError({
      code: EXEC_FAILED,
      message: `Base58 ${mode} failed: ${msg}`,
    });
  }
}

export const base58EncodeDecode = defineTool({
  meta: {
    id: "encoding/base58-encode-decode",
    name: "Base58 Encode/Decode",
    description:
      "Free online Base58 encoder/decoder — encode or decode text using Bitcoin-style Base58 encoding instantly in your browser. No data is stored. Uses the standard Bitcoin alphabet, handles leading zero bytes, and supports cryptocurrency address formats.",
    category: "encoding",
    subgroup: "Base Encoding",
    tier: ToolTier.CLIENT,
    keywords: ["base58", "bitcoin", "encode", "decode", "cryptocurrency"],
    examples: [
      {
        title: "Encode Text",
        description: "Encode text using Bitcoin-style Base58",
        input: "Hello World",
        output: "JxF12TrwUP45BMd",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
