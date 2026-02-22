import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const KSUID_EPOCH = 1400000000; // May 13, 2014

const BASE62_CHARS =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function bigIntToBase62(n: bigint): string {
  if (n === 0n) return "0";
  let result = "";
  let num = n;
  while (num > 0n) {
    result = BASE62_CHARS[Number(num % 62n)]! + result;
    num = num / 62n;
  }
  return result;
}

const inputSchema = z.object({
  count: z
    .number()
    .min(1)
    .max(100)
    .default(1)
    .describe("Number of KSUIDs to generate"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated KSUID(s)"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function generateKsuid(): string {
  // 4 bytes timestamp + 16 bytes random = 20 bytes total
  const timestamp = Math.floor(Date.now() / 1000) - KSUID_EPOCH;
  const randomBytes = new Uint8Array(16);
  crypto.getRandomValues(randomBytes);

  // Combine into 20 bytes
  const bytes = new Uint8Array(20);
  bytes[0] = (timestamp >> 24) & 0xff;
  bytes[1] = (timestamp >> 16) & 0xff;
  bytes[2] = (timestamp >> 8) & 0xff;
  bytes[3] = timestamp & 0xff;
  bytes.set(randomBytes, 4);

  // Convert to base62 (KSUID is 27 base62 chars)
  let num = 0n;
  for (let i = 0; i < bytes.length; i++) {
    num = (num << 8n) | BigInt(bytes[i]!);
  }

  return bigIntToBase62(num).padStart(27, "0");
}

function execute(input: Input): Output {
  const ids: string[] = [];
  for (let i = 0; i < input.count; i++) {
    ids.push(generateKsuid());
  }
  return { output: ids.join("\n") };
}

export const ksuidGenerator = defineTool({
  meta: {
    id: "identifiers/ksuid-generator",
    name: "KSUID Generator",
    description:
      "Free online KSUID generator — create K-Sortable Unique Identifiers instantly in your browser. No data is stored. Generates 27-character base62-encoded IDs with embedded timestamp for natural chronological sorting.",
    category: "identifiers",
    tier: ToolTier.CLIENT,
    keywords: [
      "ksuid",
      "generate",
      "sortable",
      "unique",
      "identifier",
      "base62",
      "time-ordered",
      "segment",
    ],
    examples: [
      {
        title: "Single KSUID",
        description: "Generate one K-Sortable Unique Identifier",
        input: { count: 1 },
        output: "2HFzVhtFxKEjP2oJMqXbOAlVMGy",
      },
      {
        title: "Batch KSUIDs",
        description: "Generate 3 KSUIDs for time-sortable event tracking",
        input: { count: 3 },
        output:
          "2HFzVhtFxKEjP2oJMqXbOAlVMGy\n2HFzVhtGxLFkQ3pKNrYcPBmWNHz\n2HFzVhtHxMGlR4qLOsZdQCnXOIa",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
