import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to hash with RIPEMD-160"),
});

const outputSchema = z.object({
  output: z.string().describe("RIPEMD-160 hash hex string"),
});

/**
 * Pure JS RIPEMD-160 implementation.
 */
function ripemd160(message: Uint8Array): string {
  function rotl(x: number, n: number): number {
    return (x << n) | (x >>> (32 - n));
  }

  // Padding
  const bitLen = message.length * 8;
  const padLen =
    message.length % 64 < 56
      ? 56 - (message.length % 64)
      : 120 - (message.length % 64);
  const padded = new Uint8Array(message.length + padLen + 8);
  padded.set(message);
  padded[message.length] = 0x80;

  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, bitLen >>> 0, true);
  view.setUint32(padded.length - 4, 0, true);

  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;
  let h4 = 0xc3d2e1f0;

  // Left-side selection and shifts
  const rL = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 7, 4, 13, 1, 10, 6,
    15, 3, 12, 0, 9, 5, 2, 14, 11, 8, 3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13,
    11, 5, 12, 1, 9, 11, 10, 0, 8, 12, 4, 13, 3, 7, 15, 14, 5, 6, 2, 4, 0, 5, 9,
    7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13,
  ];
  const sL = [
    11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8, 7, 6, 8, 13, 11, 9,
    7, 15, 7, 12, 15, 9, 11, 7, 13, 12, 11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13,
    6, 5, 12, 7, 5, 11, 12, 14, 15, 14, 15, 9, 8, 9, 14, 5, 6, 8, 6, 5, 12, 9,
    15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11, 8, 5, 6,
  ];

  // Right-side selection and shifts
  const rR = [
    5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12, 6, 11, 3, 7, 0, 13, 5,
    10, 14, 15, 8, 12, 4, 9, 1, 2, 15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10,
    0, 4, 13, 8, 6, 4, 1, 3, 11, 15, 0, 5, 12, 2, 13, 9, 7, 10, 14, 12, 15, 10,
    4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9, 11,
  ];
  const sR = [
    8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6, 9, 13, 15, 7, 12, 8,
    9, 11, 7, 7, 12, 7, 6, 15, 13, 11, 9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14,
    13, 13, 7, 5, 15, 5, 8, 11, 14, 14, 6, 14, 6, 9, 12, 9, 12, 5, 15, 8, 8, 5,
    12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15, 13, 11, 11,
  ];

  function f(j: number, x: number, y: number, z: number): number {
    if (j < 16) return x ^ y ^ z;
    if (j < 32) return (x & y) | (~x & z);
    if (j < 48) return (x | ~y) ^ z;
    if (j < 64) return (x & z) | (y & ~z);
    return x ^ (y | ~z);
  }

  const KL = [0x00000000, 0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xa953fd4e];
  const KR = [0x50a28be6, 0x5c4dd124, 0x6d703ef3, 0x7a6d76e9, 0x00000000];

  for (let offset = 0; offset < padded.length; offset += 64) {
    const X = new Uint32Array(16);
    for (let j = 0; j < 16; j++) {
      X[j] = view.getUint32(offset + j * 4, true);
    }

    let al = h0,
      bl = h1,
      cl = h2,
      dl = h3,
      el = h4;
    let ar = h0,
      br = h1,
      cr = h2,
      dr = h3,
      er = h4;

    for (let j = 0; j < 80; j++) {
      const round = Math.floor(j / 16);
      let T = (al + f(j, bl, cl, dl) + X[rL[j]!]! + KL[round]!) | 0;
      T = (rotl(T, sL[j]!) + el) | 0;
      al = el;
      el = dl;
      dl = rotl(cl, 10);
      cl = bl;
      bl = T;

      T = (ar + f(79 - j, br, cr, dr) + X[rR[j]!]! + KR[round]!) | 0;
      T = (rotl(T, sR[j]!) + er) | 0;
      ar = er;
      er = dr;
      dr = rotl(cr, 10);
      cr = br;
      br = T;
    }

    const T = (h1 + cl + dr) | 0;
    h1 = (h2 + dl + er) | 0;
    h2 = (h3 + el + ar) | 0;
    h3 = (h4 + al + br) | 0;
    h4 = (h0 + bl + cr) | 0;
    h0 = T;
  }

  function toLittleEndianHex(val: number): string {
    return [
      val & 0xff,
      (val >>> 8) & 0xff,
      (val >>> 16) & 0xff,
      (val >>> 24) & 0xff,
    ]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  return (
    toLittleEndianHex(h0) +
    toLittleEndianHex(h1) +
    toLittleEndianHex(h2) +
    toLittleEndianHex(h3) +
    toLittleEndianHex(h4)
  );
}

export const ripemd160Hash = defineTool({
  meta: {
    id: "crypto/ripemd160-hash",
    name: "RIPEMD-160 Hash",
    description:
      "Free online RIPEMD-160 hash generator — compute RIPEMD-160 digests instantly in your browser. No data is stored. Produces a 40-character hex hash used in Bitcoin address generation and legacy cryptographic applications.",
    category: "crypto",
    subgroup: "Hash Generators",
    tier: ToolTier.CLIENT,
    keywords: [
      "ripemd",
      "ripemd160",
      "ripemd-160",
      "hash",
      "digest",
      "crypto",
      "bitcoin",
    ],
    icon: "Hash",
    examples: [
      {
        title: "Hash Text",
        description:
          "Generate a RIPEMD-160 hash (used in Bitcoin address generation)",
        input: "hello",
        output: "108f07b8382412612c048d07d13f814118445acd",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(input.input);
    return { output: ripemd160(data) };
  },
});
