import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to hash with SHA-3"),
});

const outputSchema = z.object({
  output: z.string().describe("SHA-3 hash hex string"),
});

const optionsSchema = z.object({
  variant: z
    .enum(["sha3-256", "sha3-512"])
    .default("sha3-256")
    .describe("SHA-3 variant"),
});

/**
 * Pure JS Keccak/SHA-3 implementation.
 * State is stored as a flat array of 50 ints (25 x [lo, hi]).
 */

const RC: Array<[number, number]> = [
  [0x00000001, 0x00000000],
  [0x00008082, 0x00000000],
  [0x0000808a, 0x80000000],
  [0x80008000, 0x80000000],
  [0x0000808b, 0x00000000],
  [0x80000001, 0x00000000],
  [0x80008081, 0x80000000],
  [0x00008009, 0x80000000],
  [0x0000008a, 0x00000000],
  [0x00000088, 0x00000000],
  [0x80008009, 0x00000000],
  [0x8000000a, 0x00000000],
  [0x8000808b, 0x00000000],
  [0x0000008b, 0x80000000],
  [0x00008089, 0x80000000],
  [0x00008003, 0x80000000],
  [0x00008002, 0x80000000],
  [0x00000080, 0x80000000],
  [0x0000800a, 0x00000000],
  [0x8000000a, 0x80000000],
  [0x80008081, 0x80000000],
  [0x00008080, 0x80000000],
  [0x80000001, 0x00000000],
  [0x80008008, 0x80000000],
];

const ROTATIONS = [
  [0, 1, 62, 28, 27],
  [36, 44, 6, 55, 20],
  [3, 10, 43, 25, 39],
  [41, 45, 15, 21, 8],
  [18, 2, 61, 56, 14],
];

function sget(state: number[], idx: number): [number, number] {
  return [state[idx * 2]!, state[idx * 2 + 1]!];
}

function rotl64(lo: number, hi: number, n: number): [number, number] {
  if (n === 0) return [lo, hi];
  if (n === 32) return [hi, lo];
  if (n < 32) {
    return [(lo << n) | (hi >>> (32 - n)), (hi << n) | (lo >>> (32 - n))];
  }
  const nn = n - 32;
  return [(hi << nn) | (lo >>> (32 - nn)), (lo << nn) | (hi >>> (32 - nn))];
}

function keccakF1600(state: number[]): void {
  const B = new Array<number>(50).fill(0);
  const C = new Array<number>(10).fill(0);
  const D = new Array<number>(10).fill(0);

  for (let round = 0; round < 24; round++) {
    // Theta
    for (let x = 0; x < 5; x++) {
      const [a0, a1] = sget(state, x);
      const [b0, b1] = sget(state, x + 5);
      const [c0, c1] = sget(state, x + 10);
      const [d0, d1] = sget(state, x + 15);
      const [e0, e1] = sget(state, x + 20);
      C[x * 2] = a0 ^ b0 ^ c0 ^ d0 ^ e0;
      C[x * 2 + 1] = a1 ^ b1 ^ c1 ^ d1 ^ e1;
    }
    for (let x = 0; x < 5; x++) {
      const nx = (x + 1) % 5;
      const px = (x + 4) % 5;
      const [rlo, rhi] = rotl64(C[nx * 2]!, C[nx * 2 + 1]!, 1);
      D[x * 2] = C[px * 2]! ^ rlo;
      D[x * 2 + 1] = C[px * 2 + 1]! ^ rhi;
    }
    for (let i = 0; i < 25; i++) {
      const x = i % 5;
      state[i * 2] = state[i * 2]! ^ D[x * 2]!;
      state[i * 2 + 1] = state[i * 2 + 1]! ^ D[x * 2 + 1]!;
    }

    // Rho and Pi
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 5; y++) {
        const src = x + y * 5;
        const r = ROTATIONS[y]![x]!;
        const [rlo, rhi] = rotl64(state[src * 2]!, state[src * 2 + 1]!, r);
        const newX = y;
        const newY = (2 * x + 3 * y) % 5;
        const dst = newX + newY * 5;
        B[dst * 2] = rlo;
        B[dst * 2 + 1] = rhi;
      }
    }

    // Chi
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 5; y++) {
        const idx = x + y * 5;
        const n1 = ((x + 1) % 5) + y * 5;
        const n2 = ((x + 2) % 5) + y * 5;
        state[idx * 2] = B[idx * 2]! ^ (~B[n1 * 2]! & B[n2 * 2]!);
        state[idx * 2 + 1] =
          B[idx * 2 + 1]! ^ (~B[n1 * 2 + 1]! & B[n2 * 2 + 1]!);
      }
    }

    // Iota
    const rc = RC[round]!;
    state[0] = state[0]! ^ rc[0];
    state[1] = state[1]! ^ rc[1];
  }
}

function sha3(message: Uint8Array, outputBits: number): string {
  const rate = 1600 - outputBits * 2;
  const rateBytes = rate / 8;

  // Pad
  const padLen = rateBytes - (message.length % rateBytes);
  const padded = new Uint8Array(message.length + padLen);
  padded.set(message);
  padded[message.length] = 0x06;
  padded[padded.length - 1] = padded[padded.length - 1]! | 0x80;

  // State
  const state = new Array<number>(50).fill(0);

  // Absorb
  for (let offset = 0; offset < padded.length; offset += rateBytes) {
    for (let i = 0; i < rateBytes; i += 4) {
      const laneIdx = Math.floor(i / 8);
      const isHi = Math.floor(i / 4) % 2 === 1;
      let word = 0;
      for (let b = 0; b < 4 && i + b < rateBytes; b++) {
        word |= padded[offset + i + b]! << (b * 8);
      }
      if (isHi) {
        state[laneIdx * 2 + 1] = state[laneIdx * 2 + 1]! ^ word;
      } else {
        state[laneIdx * 2] = state[laneIdx * 2]! ^ word;
      }
    }
    keccakF1600(state);
  }

  // Squeeze
  const outputBytes = outputBits / 8;
  const result = new Uint8Array(outputBytes);
  let resultOffset = 0;

  while (resultOffset < outputBytes) {
    const bytesToExtract = Math.min(rateBytes, outputBytes - resultOffset);
    for (let i = 0; i < bytesToExtract; i++) {
      const laneIdx = Math.floor(i / 8);
      const byteInLane = i % 8;
      const isHi = byteInLane >= 4;
      const word = isHi ? state[laneIdx * 2 + 1]! : state[laneIdx * 2]!;
      result[resultOffset + i] = (word >>> ((byteInLane % 4) * 8)) & 0xff;
    }
    resultOffset += bytesToExtract;
    if (resultOffset < outputBytes) {
      keccakF1600(state);
    }
  }

  return Array.from(result)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const sha3Hash = defineTool({
  meta: {
    id: "crypto/sha3-hash",
    name: "SHA-3 Hash",
    description:
      "Free online SHA-3 hash generator — compute SHA-3 (Keccak) digests instantly in your browser. No data is stored. Supports SHA3-256 and SHA3-512 variants with hex output.",
    category: "crypto",
    subgroup: "Hash Generators",
    tier: ToolTier.CLIENT,
    keywords: ["sha3", "sha-3", "keccak", "hash", "digest", "crypto"],
    icon: "Hash",
    examples: [
      {
        title: "SHA3-256 Hash",
        description: "Generate a SHA-3 (Keccak) 256-bit hash of text",
        input: "hello",
        output:
          "3338be694f50c5f338814986cdf0686453a888b84f424d792af4b9202398f392",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute: (input, options) => {
    const variant = options?.variant ?? "sha3-256";
    const encoder = new TextEncoder();
    const data = encoder.encode(input.input);
    const bits = variant === "sha3-512" ? 512 : 256;
    return { output: sha3(data, bits) };
  },
});
