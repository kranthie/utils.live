import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  count: z
    .number()
    .min(1)
    .max(100)
    .default(1)
    .describe("Number of UUIDs to generate"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated UUID(s)"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function hexByte(b: number): string {
  return b.toString(16).padStart(2, "0");
}

function generateUuidV1(): string {
  // UUID v1 is time-based
  // Timestamp: 100-nanosecond intervals since Oct 15, 1582
  const EPOCH_OFFSET = 122192928000000000n; // 100ns intervals from 1582 to 1970
  const now = BigInt(Date.now()) * 10000n + EPOCH_OFFSET;

  const timeLow = Number(now & 0xffffffffn);
  const timeMid = Number((now >> 32n) & 0xffffn);
  const timeHiAndVersion = Number((now >> 48n) & 0x0fffn) | 0x1000; // version 1

  // Clock seq with variant bits
  const randomBytes = new Uint8Array(8);
  crypto.getRandomValues(randomBytes);
  const clockSeq = ((randomBytes[0]! & 0x3f) | 0x80) * 256 + randomBytes[1]!; // variant 10xx

  // Node (6 random bytes to simulate MAC)
  const node = randomBytes.slice(2, 8);

  const hex = [
    timeLow.toString(16).padStart(8, "0"),
    timeMid.toString(16).padStart(4, "0"),
    timeHiAndVersion.toString(16).padStart(4, "0"),
    clockSeq.toString(16).padStart(4, "0"),
    Array.from(node)
      .map((b) => hexByte(b))
      .join(""),
  ];

  return hex.join("-");
}

function execute(input: Input): Output {
  const uuids: string[] = [];
  for (let i = 0; i < input.count; i++) {
    uuids.push(generateUuidV1());
  }
  return { output: uuids.join("\n") };
}

export const uuidV1Generator = defineTool({
  meta: {
    id: "identifiers/uuid-v1-generator",
    name: "UUID v1 Generator",
    description:
      "Free online UUID v1 generator — create time-based UUID version 1 identifiers instantly in your browser. No data is stored. Generates RFC 4122 compliant UUIDs with embedded 100-nanosecond timestamp, clock sequence, and random node bytes.",
    category: "identifiers",
    tier: ToolTier.CLIENT,
    keywords: [
      "uuid",
      "v1",
      "generate",
      "time",
      "identifier",
      "rfc4122",
      "mac",
    ],
    examples: [
      {
        title: "Single UUID v1",
        description: "Generate one time-based UUID v1",
        input: { count: 1 },
        output: "d9e7a5e0-3b1a-11ee-be56-0242ac120002",
      },
      {
        title: "Multiple UUID v1s",
        description: "Generate 5 time-based UUID v1 identifiers",
        input: { count: 5 },
        output:
          "d9e7a5e0-3b1a-11ee-be56-0242ac120002\nd9e7a5e1-3b1a-11ee-be56-0242ac120002\nd9e7a5e2-3b1a-11ee-be56-0242ac120002\nd9e7a5e3-3b1a-11ee-be56-0242ac120002\nd9e7a5e4-3b1a-11ee-be56-0242ac120002",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
