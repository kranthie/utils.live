import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to hash with BLAKE2"),
});

const outputSchema = z.object({
  output: z.string().describe("BLAKE2b hash hex string"),
});

const optionsSchema = z.object({
  digestLength: z
    .number()
    .min(1)
    .max(64)
    .default(32)
    .describe("Output hash length in bytes (1-64)"),
});

/**
 * Pure JS BLAKE2b implementation (simplified).
 * Based on RFC 7693.
 * Uses flat arrays with explicit indexing to avoid strict TS issues.
 */

// BLAKE2b IV stored as [lo, hi] pairs in flat array
const IV_FLAT = [
  0xf3bcc908, 0x6a09e667, 0x84caa73b, 0xbb67ae85, 0xfe94f82b, 0x3c6ef372,
  0x5f1d36f1, 0xa54ff53a, 0xade682d1, 0x510e527f, 0x2b3e6c1f, 0x9b05688c,
  0xfb41bd6b, 0x1f83d9ab, 0x137e2179, 0x5be0cd19,
];

const SIGMA = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  [14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3],
  [11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4],
  [7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8],
  [9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13],
  [2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9],
  [12, 5, 1, 15, 14, 13, 4, 10, 0, 7, 6, 3, 9, 2, 8, 11],
  [13, 11, 7, 14, 12, 1, 3, 9, 5, 0, 15, 4, 8, 6, 2, 10],
  [6, 15, 14, 9, 11, 3, 0, 8, 12, 2, 13, 7, 1, 4, 10, 5],
  [10, 2, 8, 4, 7, 6, 1, 5, 15, 11, 9, 14, 3, 12, 13, 0],
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  [14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3],
];

// Helper: get value from flat 64-bit array (lo at index*2, hi at index*2+1)
function getLo(arr: number[], idx: number): number {
  return arr[idx * 2]!;
}
function getHi(arr: number[], idx: number): number {
  return arr[idx * 2 + 1]!;
}
function setWord(arr: number[], idx: number, lo: number, hi: number): void {
  arr[idx * 2] = lo;
  arr[idx * 2 + 1] = hi;
}

function add64(
  aLo: number,
  aHi: number,
  bLo: number,
  bHi: number
): [number, number] {
  const lo = (aLo + bLo) | 0;
  const carry = ((aLo & bLo) | ((aLo | bLo) & ~lo)) >>> 31;
  const hi = (aHi + bHi + carry) | 0;
  return [lo, hi];
}

function xor64(
  aLo: number,
  aHi: number,
  bLo: number,
  bHi: number
): [number, number] {
  return [aLo ^ bLo, aHi ^ bHi];
}

function rotr64(lo: number, hi: number, n: number): [number, number] {
  if (n === 32) return [hi, lo];
  if (n < 32) {
    return [(lo >>> n) | (hi << (32 - n)), (hi >>> n) | (lo << (32 - n))];
  }
  const nn = n - 32;
  return [(hi >>> nn) | (lo << (32 - nn)), (lo >>> nn) | (hi << (32 - nn))];
}

function blake2b(message: Uint8Array, digestLength: number): string {
  // State: 8 x 64-bit words as flat [lo, hi, lo, hi, ...]
  const h = IV_FLAT.slice();

  // XOR digest length and fanout/depth into h[0]
  const [xLo, xHi] = xor64(
    getLo(h, 0),
    getHi(h, 0),
    0x01010000 ^ digestLength,
    0
  );
  setWord(h, 0, xLo, xHi);

  const blockSize = 128;
  let bytesCompressed = 0;
  const blocks = Math.ceil(message.length / blockSize) || 1;

  for (let block = 0; block < blocks; block++) {
    const offset = block * blockSize;
    const isLast = block === blocks - 1;
    const bytesInBlock = isLast ? message.length - offset : blockSize;
    bytesCompressed += bytesInBlock;

    // Prepare message block: 16 x 64-bit words as flat array
    const buf = new Uint8Array(blockSize);
    for (let i = 0; i < bytesInBlock && offset + i < message.length; i++) {
      buf[i] = message[offset + i]!;
    }

    const m: number[] = [];
    for (let i = 0; i < 16; i++) {
      const lo =
        buf[i * 8]! |
        (buf[i * 8 + 1]! << 8) |
        (buf[i * 8 + 2]! << 16) |
        (buf[i * 8 + 3]! << 24);
      const hi =
        buf[i * 8 + 4]! |
        (buf[i * 8 + 5]! << 8) |
        (buf[i * 8 + 6]! << 16) |
        (buf[i * 8 + 7]! << 24);
      m.push(lo, hi);
    }

    // Initialize working vector v (16 x 64-bit = flat 32 ints)
    const v: number[] = new Array<number>(32).fill(0);
    for (let i = 0; i < 8; i++) {
      setWord(v, i, getLo(h, i), getHi(h, i));
      setWord(v, i + 8, IV_FLAT[i * 2]!, IV_FLAT[i * 2 + 1]!);
    }

    // XOR counter into v[12]
    const [cLo, cHi] = xor64(
      getLo(v, 12),
      getHi(v, 12),
      bytesCompressed | 0,
      0
    );
    setWord(v, 12, cLo, cHi);

    // If last block, invert v[14]
    if (isLast) {
      setWord(v, 14, ~getLo(v, 14), ~getHi(v, 14));
    }

    // G mixing function
    const G = function (
      a: number,
      b: number,
      c: number,
      d: number,
      mxIdx: number,
      myIdx: number
    ): void {
      let [lo, hi] = add64(getLo(v, a), getHi(v, a), getLo(v, b), getHi(v, b));
      [lo, hi] = add64(lo, hi, getLo(m, mxIdx), getHi(m, mxIdx));
      setWord(v, a, lo, hi);

      const [d1Lo, d1Hi] = xor64(
        getLo(v, d),
        getHi(v, d),
        getLo(v, a),
        getHi(v, a)
      );
      const [rd1Lo, rd1Hi] = rotr64(d1Lo, d1Hi, 32);
      setWord(v, d, rd1Lo, rd1Hi);

      let [cLo2, cHi2] = add64(
        getLo(v, c),
        getHi(v, c),
        getLo(v, d),
        getHi(v, d)
      );
      setWord(v, c, cLo2, cHi2);

      const [b1Lo, b1Hi] = xor64(
        getLo(v, b),
        getHi(v, b),
        getLo(v, c),
        getHi(v, c)
      );
      const [rb1Lo, rb1Hi] = rotr64(b1Lo, b1Hi, 24);
      setWord(v, b, rb1Lo, rb1Hi);

      [lo, hi] = add64(getLo(v, a), getHi(v, a), getLo(v, b), getHi(v, b));
      [lo, hi] = add64(lo, hi, getLo(m, myIdx), getHi(m, myIdx));
      setWord(v, a, lo, hi);

      const [d2Lo, d2Hi] = xor64(
        getLo(v, d),
        getHi(v, d),
        getLo(v, a),
        getHi(v, a)
      );
      const [rd2Lo, rd2Hi] = rotr64(d2Lo, d2Hi, 16);
      setWord(v, d, rd2Lo, rd2Hi);

      [cLo2, cHi2] = add64(getLo(v, c), getHi(v, c), getLo(v, d), getHi(v, d));
      setWord(v, c, cLo2, cHi2);

      const [b2Lo, b2Hi] = xor64(
        getLo(v, b),
        getHi(v, b),
        getLo(v, c),
        getHi(v, c)
      );
      const [rb2Lo, rb2Hi] = rotr64(b2Lo, b2Hi, 63);
      setWord(v, b, rb2Lo, rb2Hi);
    };

    // 12 rounds
    for (let round = 0; round < 12; round++) {
      const s = SIGMA[round]!;
      G(0, 4, 8, 12, s[0]!, s[1]!);
      G(1, 5, 9, 13, s[2]!, s[3]!);
      G(2, 6, 10, 14, s[4]!, s[5]!);
      G(3, 7, 11, 15, s[6]!, s[7]!);
      G(0, 5, 10, 15, s[8]!, s[9]!);
      G(1, 6, 11, 12, s[10]!, s[11]!);
      G(2, 7, 8, 13, s[12]!, s[13]!);
      G(3, 4, 9, 14, s[14]!, s[15]!);
    }

    // Finalize
    for (let i = 0; i < 8; i++) {
      const [fLo, fHi] = xor64(
        getLo(h, i),
        getHi(h, i),
        getLo(v, i) ^ getLo(v, i + 8),
        getHi(v, i) ^ getHi(v, i + 8)
      );
      setWord(h, i, fLo, fHi);
    }
  }

  // Extract output
  const result = new Uint8Array(digestLength);
  for (let i = 0; i < digestLength; i++) {
    const wordIdx = Math.floor(i / 8);
    const byteIdx = i % 8;
    if (byteIdx < 4) {
      result[i] = (getLo(h, wordIdx) >>> (byteIdx * 8)) & 0xff;
    } else {
      result[i] = (getHi(h, wordIdx) >>> ((byteIdx - 4) * 8)) & 0xff;
    }
  }

  return Array.from(result)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const blake2Hash = defineTool({
  meta: {
    id: "crypto/blake2-hash",
    name: "BLAKE2b Hash",
    description:
      "Free online BLAKE2b hash generator — compute BLAKE2b hashes instantly in your browser. No data is stored. Supports configurable digest length from 1 to 64 bytes with hex output.",
    category: "crypto",
    subgroup: "Hash Generators",
    tier: ToolTier.CLIENT,
    keywords: ["blake2", "blake2b", "hash", "digest", "crypto"],
    icon: "Hash",
    examples: [
      {
        title: "Hash Text",
        description: "Generate a BLAKE2b-256 hash of a string",
        input: "hello",
        output:
          "324dcf027dd4a30a932c441f365a25e86b173defa4b8e58948253471b81b72cf",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute: (input, options) => {
    const digestLength = options?.digestLength ?? 32;
    const encoder = new TextEncoder();
    const data = encoder.encode(input.input);
    return { output: blake2b(data, digestLength) };
  },
});
