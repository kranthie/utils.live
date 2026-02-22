import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { EXEC_FAILED } from "../../core/error-codes";

const BASE62_ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

const inputSchema = z.object({
  input: z.string().describe("Text to encode or Base62 string to decode"),
});

const outputSchema = z.object({
  output: z.string().describe("Encoded or decoded result"),
});

const optionsSchema = z.object({
  mode: z
    .enum(["encode", "decode"])
    .default("encode")
    .describe("Encode text to Base62 or decode Base62 to text"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

export function base62Encode(bytes: Uint8Array): string {
  if (bytes.length === 0) return "";

  let num = BigInt(0);
  for (const b of bytes) {
    num = num * BigInt(256) + BigInt(b);
  }

  if (num === BigInt(0)) return BASE62_ALPHABET[0] ?? "0";

  let result = "";
  while (num > BigInt(0)) {
    const remainder = Number(num % BigInt(62));
    num = num / BigInt(62);
    result = BASE62_ALPHABET[remainder] + result;
  }

  return result;
}

export function base62Decode(str: string): Uint8Array {
  if (str.length === 0) return new Uint8Array(0);

  for (const ch of str) {
    if (!BASE62_ALPHABET.includes(ch)) {
      throw new Error(`Invalid Base62 character: '${ch}'`);
    }
  }

  let num = BigInt(0);
  for (const ch of str) {
    num = num * BigInt(62) + BigInt(BASE62_ALPHABET.indexOf(ch));
  }

  if (num === BigInt(0)) return new Uint8Array([0]);

  const hexStr = num.toString(16);
  const paddedHex = hexStr.length % 2 ? "0" + hexStr : hexStr;
  const byteLength = paddedHex.length / 2;
  const bytes = new Uint8Array(byteLength);

  for (let i = 0; i < byteLength; i++) {
    bytes[i] = parseInt(paddedHex.substring(i * 2, i * 2 + 2), 16);
  }

  return bytes;
}

function execute(input: Input, options?: Options): Output {
  const mode = options?.mode ?? "encode";

  try {
    if (mode === "encode") {
      const encoder = new TextEncoder();
      const bytes = encoder.encode(input.input);
      return { output: base62Encode(bytes) };
    } else {
      const bytes = base62Decode(input.input);
      const decoder = new TextDecoder();
      return { output: decoder.decode(bytes) };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Base62 operation failed";
    throw createToolError({
      code: EXEC_FAILED,
      message: `Base62 ${mode} failed: ${msg}`,
    });
  }
}

export const base62EncodeDecode = defineTool({
  meta: {
    id: "encoding/base62-encode-decode",
    name: "Base62 Encode/Decode",
    description:
      "Free online Base62 encoder/decoder — encode or decode text using Base62 alphanumeric encoding instantly in your browser. No data is stored. Produces URL-safe output using only 0-9, A-Z, and a-z characters.",
    category: "encoding",
    subgroup: "Base Encoding",
    tier: ToolTier.CLIENT,
    keywords: ["base62", "encode", "decode", "alphanumeric", "short-url"],
    examples: [
      {
        title: "Encode Text",
        description: "Encode a string using Base62 for URL-friendly output",
        input: "Hello",
        output: "5TP3P3v",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
