import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to hash with MurmurHash3"),
});

const outputSchema = z.object({
  output: z.string().describe("MurmurHash3 hex string"),
});

const optionsSchema = z.object({
  seed: z.number().default(0).describe("Hash seed value"),
});

/**
 * Pure JS MurmurHash3 32-bit implementation.
 */
function murmurhash3_32(data: Uint8Array, seed: number): number {
  const c1 = 0xcc9e2d51;
  const c2 = 0x1b873593;
  const len = data.length;
  let h1 = seed;
  const nblocks = Math.floor(len / 4);

  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

  // Body
  for (let i = 0; i < nblocks; i++) {
    let k1 = view.getUint32(i * 4, true);
    k1 = Math.imul(k1, c1);
    k1 = (k1 << 15) | (k1 >>> 17);
    k1 = Math.imul(k1, c2);

    h1 ^= k1;
    h1 = (h1 << 13) | (h1 >>> 19);
    h1 = (Math.imul(h1, 5) + 0xe6546b64) | 0;
  }

  // Tail
  const tail = nblocks * 4;
  let k1 = 0;
  const remainder = len & 3;
  if (remainder >= 3) k1 ^= data[tail + 2]! << 16;
  if (remainder >= 2) k1 ^= data[tail + 1]! << 8;
  if (remainder >= 1) {
    k1 ^= data[tail]!;
    k1 = Math.imul(k1, c1);
    k1 = (k1 << 15) | (k1 >>> 17);
    k1 = Math.imul(k1, c2);
    h1 ^= k1;
  }

  // Finalization
  h1 ^= len;
  h1 ^= h1 >>> 16;
  h1 = Math.imul(h1, 0x85ebca6b);
  h1 ^= h1 >>> 13;
  h1 = Math.imul(h1, 0xc2b2ae35);
  h1 ^= h1 >>> 16;

  return h1 >>> 0;
}

export const murmurhash = defineTool({
  meta: {
    id: "crypto/murmurhash",
    name: "MurmurHash3",
    description:
      "Free online MurmurHash3 generator — compute MurmurHash3 32-bit hashes instantly in your browser. No data is stored. Supports configurable seed values with hex output for hash tables and data partitioning.",
    category: "crypto",
    subgroup: "Hash Generators",
    tier: ToolTier.CLIENT,
    keywords: [
      "murmurhash",
      "murmur",
      "murmurhash3",
      "hash",
      "fast",
      "non-cryptographic",
    ],
    icon: "Hash",
    examples: [
      {
        title: "Hash a Key",
        description: "Compute MurmurHash3 for hash table distribution",
        input: "user:12345",
        output: "edcdb22a",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute: (input, options) => {
    const seed = options?.seed ?? 0;
    const encoder = new TextEncoder();
    const data = encoder.encode(input.input);
    const hash = murmurhash3_32(data, seed);
    return { output: hash.toString(16).padStart(8, "0") };
  },
});
