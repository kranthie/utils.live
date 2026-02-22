import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  type: z
    .enum(["uuid-v4", "uuid-v7", "nanoid", "short-id", "hex", "numeric"])
    .default("uuid-v4")
    .describe("Type of ID to generate"),
  count: z
    .number()
    .min(1)
    .max(1000)
    .default(10)
    .describe("Number of IDs to generate"),
  length: z
    .number()
    .min(4)
    .max(128)
    .default(21)
    .describe("Length for variable-length IDs (nanoid, short-id, hex)"),
  separator: z
    .enum(["newline", "comma", "space", "tab"])
    .default("newline")
    .describe("Separator between IDs"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated IDs"),
  count: z.number().describe("Number of IDs generated"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function randomHex(length: number): string {
  const bytes = new Uint8Array(Math.ceil(length / 2));
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .substring(0, length);
}

function randomNumeric(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => (b % 10).toString())
    .join("");
}

function randomNanoid(length: number): string {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => alphabet[b % alphabet.length])
    .join("");
}

function randomShortId(length: number): string {
  const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => alphabet[b % alphabet.length])
    .join("");
}

function generateUuidV7(): string {
  const now = Date.now();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[0] = (now / 2 ** 40) & 0xff;
  bytes[1] = (now / 2 ** 32) & 0xff;
  bytes[2] = (now / 2 ** 24) & 0xff;
  bytes[3] = (now / 2 ** 16) & 0xff;
  bytes[4] = (now / 2 ** 8) & 0xff;
  bytes[5] = now & 0xff;
  bytes[6] = (bytes[6]! & 0x0f) | 0x70;
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
  const separators: Record<string, string> = {
    newline: "\n",
    comma: ", ",
    space: " ",
    tab: "\t",
  };
  const sep = separators[input.separator]!;

  const ids: string[] = [];
  for (let i = 0; i < input.count; i++) {
    switch (input.type) {
      case "uuid-v4":
        ids.push(crypto.randomUUID());
        break;
      case "uuid-v7":
        ids.push(generateUuidV7());
        break;
      case "nanoid":
        ids.push(randomNanoid(input.length));
        break;
      case "short-id":
        ids.push(randomShortId(input.length));
        break;
      case "hex":
        ids.push(randomHex(input.length));
        break;
      case "numeric":
        ids.push(randomNumeric(input.length));
        break;
    }
  }

  return {
    output: ids.join(sep),
    count: ids.length,
  };
}

export const bulkIdGenerator = defineTool({
  meta: {
    id: "identifiers/bulk-id-generator",
    name: "Bulk ID Generator",
    description:
      "Free online bulk ID generator — create multiple UUIDs, NanoIDs, short IDs, hex, or numeric identifiers instantly in your browser. No data is stored. Supports UUID v4, UUID v7, NanoID, short alphanumeric, hex, and numeric formats with configurable count, length, and separator.",
    category: "identifiers",
    tier: ToolTier.CLIENT,
    keywords: [
      "bulk",
      "batch",
      "id",
      "generate",
      "multiple",
      "uuid",
      "nanoid",
      "test-data",
      "seed",
      "database",
    ],
    examples: [
      {
        title: "Batch UUID v4",
        description: "Generate 5 UUID v4 identifiers separated by newlines",
        input: { type: "uuid-v4", count: 5, length: 21, separator: "newline" },
        output:
          "550e8400-e29b-41d4-a716-446655440000\n6ba7b810-9dad-11d1-80b4-00c04fd430c8\n7c9e6679-7425-40de-944b-e07fc1f90ae7\na1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d\nf47ac10b-58cc-4372-a567-0e02b2c3d479",
      },
      {
        title: "Comma-Separated Short IDs",
        description: "Generate 3 short alphanumeric IDs separated by commas",
        input: { type: "short-id", count: 3, length: 8, separator: "comma" },
        output: "a1b2c3d4, e5f6g7h8, k9m0n1p2",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
