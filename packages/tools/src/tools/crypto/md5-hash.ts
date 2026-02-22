import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to hash with MD5"),
});

const outputSchema = z.object({
  output: z.string().describe("MD5 hash hex string"),
});

/**
 * Pure JS MD5 implementation.
 * Based on RFC 1321.
 */
function md5(message: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(message);

  // Pre-processing: adding padding bits
  const bitLen = bytes.length * 8;
  const padLen =
    bytes.length % 64 < 56
      ? 56 - (bytes.length % 64)
      : 120 - (bytes.length % 64);
  const padded = new Uint8Array(bytes.length + padLen + 8);
  padded.set(bytes);
  padded[bytes.length] = 0x80;

  // Append original length in bits as 64-bit little-endian
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, bitLen >>> 0, true);
  view.setUint32(padded.length - 4, Math.floor(bitLen / 0x100000000), true);

  // Initialize MD5 state
  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  // Per-round shift amounts
  const s = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5,
    9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11,
    16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10,
    15, 21,
  ];

  // Pre-computed T table: floor(2^32 * abs(sin(i + 1)))
  const K = new Uint32Array(64);
  for (let i = 0; i < 64; i++) {
    K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000);
  }

  function rotateLeft(x: number, n: number): number {
    return (x << n) | (x >>> (32 - n));
  }

  // Process each 512-bit block
  for (let offset = 0; offset < padded.length; offset += 64) {
    const M = new Uint32Array(16);
    for (let j = 0; j < 16; j++) {
      M[j] = view.getUint32(offset + j * 4, true);
    }

    let A = a0;
    let B = b0;
    let C = c0;
    let D = d0;

    for (let i = 0; i < 64; i++) {
      let F: number;
      let g: number;

      if (i < 16) {
        F = (B & C) | (~B & D);
        g = i;
      } else if (i < 32) {
        F = (D & B) | (~D & C);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        F = B ^ C ^ D;
        g = (3 * i + 5) % 16;
      } else {
        F = C ^ (B | ~D);
        g = (7 * i) % 16;
      }

      F = (F + A + K[i]! + M[g]!) | 0;
      A = D;
      D = C;
      C = B;
      B = (B + rotateLeft(F, s[i]!)) | 0;
    }

    a0 = (a0 + A) | 0;
    b0 = (b0 + B) | 0;
    c0 = (c0 + C) | 0;
    d0 = (d0 + D) | 0;
  }

  // Convert to hex (little-endian)
  function toLittleEndianHex(val: number): string {
    const bytes = [
      val & 0xff,
      (val >>> 8) & 0xff,
      (val >>> 16) & 0xff,
      (val >>> 24) & 0xff,
    ];
    return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  return (
    toLittleEndianHex(a0) +
    toLittleEndianHex(b0) +
    toLittleEndianHex(c0) +
    toLittleEndianHex(d0)
  );
}

export const md5Hash = defineTool({
  meta: {
    id: "crypto/md5-hash",
    name: "MD5 Hash",
    description:
      "Free online MD5 hash generator — compute MD5 digests instantly in your browser. No data is stored. Produces a 32-character hex hash for checksums and non-security fingerprinting (not suitable for cryptographic use).",
    category: "crypto",
    subgroup: "Hash Generators",
    tier: ToolTier.CLIENT,
    keywords: ["md5", "hash", "digest", "checksum", "crypto"],
    icon: "Hash",
    examples: [
      {
        title: "Simple Hash",
        description: "Generate the MD5 digest of a short string",
        input: "hello",
        output: "5d41402abc4b2a76b9719d911017c592",
      },
      {
        title: "Checksum",
        description: "Create a quick fingerprint for file integrity checks",
        input: "The quick brown fox jumps over the lazy dog",
        output: "9e107d9d372bb6826bd81d3542a419d6",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    if (!input.input && input.input !== "") {
      throw new Error("Input is required");
    }
    return { output: md5(input.input) };
  },
});
