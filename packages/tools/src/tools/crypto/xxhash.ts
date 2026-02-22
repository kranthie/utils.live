import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to hash with xxHash"),
});

const outputSchema = z.object({
  output: z.string().describe("xxHash32 hex string"),
});

const optionsSchema = z.object({
  seed: z.number().default(0).describe("Hash seed value"),
});

/**
 * Pure JS xxHash32 implementation.
 */
const PRIME32_1 = 0x9e3779b1;
const PRIME32_2 = 0x85ebca77;
const PRIME32_3 = 0xc2b2ae3d;
const PRIME32_4 = 0x27d4eb2f;
const PRIME32_5 = 0x165667b1;

function rotl32(x: number, r: number): number {
  return (x << r) | (x >>> (32 - r));
}

function xxhash32(data: Uint8Array, seed: number): number {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let h32: number;
  let offset = 0;
  const len = data.length;

  if (len >= 16) {
    let v1 = (seed + PRIME32_1 + PRIME32_2) | 0;
    let v2 = (seed + PRIME32_2) | 0;
    let v3 = seed | 0;
    let v4 = (seed - PRIME32_1) | 0;

    do {
      v1 = Math.imul(
        rotl32(
          (v1 + Math.imul(view.getUint32(offset, true), PRIME32_2)) | 0,
          13
        ),
        PRIME32_1
      );
      offset += 4;
      v2 = Math.imul(
        rotl32(
          (v2 + Math.imul(view.getUint32(offset, true), PRIME32_2)) | 0,
          13
        ),
        PRIME32_1
      );
      offset += 4;
      v3 = Math.imul(
        rotl32(
          (v3 + Math.imul(view.getUint32(offset, true), PRIME32_2)) | 0,
          13
        ),
        PRIME32_1
      );
      offset += 4;
      v4 = Math.imul(
        rotl32(
          (v4 + Math.imul(view.getUint32(offset, true), PRIME32_2)) | 0,
          13
        ),
        PRIME32_1
      );
      offset += 4;
    } while (offset <= len - 16);

    h32 = (rotl32(v1, 1) + rotl32(v2, 7) + rotl32(v3, 12) + rotl32(v4, 18)) | 0;
  } else {
    h32 = (seed + PRIME32_5) | 0;
  }

  h32 = (h32 + len) | 0;

  while (offset <= len - 4) {
    h32 = Math.imul(
      rotl32(
        (h32 + Math.imul(view.getUint32(offset, true), PRIME32_3)) | 0,
        17
      ),
      PRIME32_4
    );
    offset += 4;
  }

  while (offset < len) {
    h32 = Math.imul(
      rotl32((h32 + Math.imul(data[offset]!, PRIME32_5)) | 0, 11),
      PRIME32_1
    );
    offset++;
  }

  h32 = Math.imul(h32 ^ (h32 >>> 15), PRIME32_2);
  h32 = Math.imul(h32 ^ (h32 >>> 13), PRIME32_3);
  h32 = (h32 ^ (h32 >>> 16)) >>> 0;

  return h32;
}

export const xxhash = defineTool({
  meta: {
    id: "crypto/xxhash",
    name: "xxHash",
    description:
      "Free online xxHash32 generator — compute xxHash32 non-cryptographic hashes instantly in your browser. No data is stored. Supports configurable seed values with 8-character hex output for fast data checksums.",
    category: "crypto",
    subgroup: "Hash Generators",
    tier: ToolTier.CLIENT,
    keywords: ["xxhash", "xxh32", "hash", "fast", "non-cryptographic"],
    icon: "Hash",
    examples: [
      {
        title: "xxHash of Text",
        description: "Compute a fast non-cryptographic xxHash32 digest",
        input: "hello",
        output: "fb0077f9",
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
    const hash = xxhash32(data, seed);
    return { output: hash.toString(16).padStart(8, "0") };
  },
});
