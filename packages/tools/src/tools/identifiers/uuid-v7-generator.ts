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

function generateUuidV7(): string {
  const now = Date.now();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  // Timestamp (48 bits): first 6 bytes
  bytes[0] = (now / 2 ** 40) & 0xff;
  bytes[1] = (now / 2 ** 32) & 0xff;
  bytes[2] = (now / 2 ** 24) & 0xff;
  bytes[3] = (now / 2 ** 16) & 0xff;
  bytes[4] = (now / 2 ** 8) & 0xff;
  bytes[5] = now & 0xff;

  // Version 7 (4 bits)
  bytes[6] = (bytes[6]! & 0x0f) | 0x70;

  // Variant 10xx (2 bits)
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;

  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return [
    hex.substring(0, 8),
    hex.substring(8, 12),
    hex.substring(12, 16),
    hex.substring(16, 20),
    hex.substring(20, 32),
  ].join("-");
}

function execute(input: Input): Output {
  const uuids: string[] = [];
  for (let i = 0; i < input.count; i++) {
    uuids.push(generateUuidV7());
  }
  return { output: uuids.join("\n") };
}

export const uuidV7Generator = defineTool({
  meta: {
    id: "identifiers/uuid-v7-generator",
    name: "UUID v7 Generator",
    description:
      "Free online UUID v7 generator — create time-ordered UUID version 7 identifiers instantly in your browser. No data is stored. Generates RFC 9562 compliant UUIDs with embedded Unix millisecond timestamp for natural chronological sorting in databases.",
    category: "identifiers",
    tier: ToolTier.CLIENT,
    keywords: [
      "uuid",
      "v7",
      "generate",
      "time",
      "ordered",
      "sortable",
      "rfc9562",
      "database",
    ],
    examples: [
      {
        title: "Single UUID v7",
        description: "Generate one time-ordered UUID v7",
        input: { count: 1 },
        output: "01893a6a-3f4b-7abc-8def-0123456789ab",
      },
      {
        title: "Batch UUID v7",
        description: "Generate 3 sortable UUID v7 identifiers",
        input: { count: 3 },
        output:
          "01893a6a-3f4b-7abc-8def-0123456789ab\n01893a6a-3f4c-7def-9012-abcdef012345\n01893a6a-3f4d-7012-a345-6789abcdef01",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
