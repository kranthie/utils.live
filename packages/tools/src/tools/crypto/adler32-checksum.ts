import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to compute Adler-32 checksum"),
});

const outputSchema = z.object({
  output: z.string().describe("Adler-32 checksum as hex string"),
});

/**
 * Adler-32 checksum implementation.
 * Used by zlib. Fast but not cryptographic.
 */
function adler32(data: Uint8Array): number {
  const MOD_ADLER = 65521;
  let a = 1;
  let b = 0;

  for (let i = 0; i < data.length; i++) {
    a = (a + data[i]!) % MOD_ADLER;
    b = (b + a) % MOD_ADLER;
  }

  return ((b << 16) | a) >>> 0;
}

export const adler32Checksum = defineTool({
  meta: {
    id: "crypto/adler32-checksum",
    name: "Adler-32 Checksum",
    description:
      "Free online Adler-32 checksum generator — compute Adler-32 checksums instantly in your browser. No data is stored. Outputs an 8-character hex checksum used by zlib and data integrity checks.",
    category: "crypto",
    subgroup: "Hash Generators",
    tier: ToolTier.CLIENT,
    keywords: ["adler32", "adler-32", "checksum", "hash", "zlib"],
    icon: "Hash",
    examples: [
      {
        title: "Checksum Text",
        description: "Compute the Adler-32 checksum of a simple string",
        input: "Hello, World!",
        output: "1f9e046a",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(input.input);
    const checksum = adler32(data);
    return { output: checksum.toString(16).padStart(8, "0") };
  },
});
