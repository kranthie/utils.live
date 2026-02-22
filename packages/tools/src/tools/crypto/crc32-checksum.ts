import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to compute CRC32 checksum"),
});

const outputSchema = z.object({
  output: z.string().describe("CRC32 checksum as hex string"),
});

/**
 * Pre-computed CRC32 lookup table.
 */
const CRC32_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let crc = i;
  for (let j = 0; j < 8; j++) {
    crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
  }
  CRC32_TABLE[i] = crc;
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ data[i]!) & 0xff]!;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export const crc32Checksum = defineTool({
  meta: {
    id: "crypto/crc32-checksum",
    name: "CRC32 Checksum",
    description:
      "Free online CRC32 checksum calculator — compute CRC32 checksums instantly in your browser. No data is stored. Outputs an 8-character hex checksum for file integrity and data validation.",
    category: "crypto",
    subgroup: "Hash Generators",
    tier: ToolTier.CLIENT,
    keywords: ["crc32", "crc", "checksum", "hash", "integrity"],
    icon: "Hash",
    examples: [
      {
        title: "CRC32 of Text",
        description: "Compute the CRC32 checksum of a string",
        input: "Hello, World!",
        output: "ec4ac3d0",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(input.input);
    const checksum = crc32(data);
    return { output: checksum.toString(16).padStart(8, "0") };
  },
});
