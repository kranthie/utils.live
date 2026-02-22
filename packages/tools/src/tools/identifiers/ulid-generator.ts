import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const CROCKFORD_BASE32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

const inputSchema = z.object({
  count: z
    .number()
    .min(1)
    .max(100)
    .default(1)
    .describe("Number of ULIDs to generate"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated ULID(s)"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function generateUlid(): string {
  const now = Date.now();

  // Encode timestamp (48 bits = 10 Crockford base32 chars)
  let time = now;
  const timeChars: string[] = [];
  for (let i = 0; i < 10; i++) {
    timeChars.unshift(CROCKFORD_BASE32[time % 32]!);
    time = Math.floor(time / 32);
  }

  // Encode randomness (80 bits = 16 Crockford base32 chars)
  const randomBytes = new Uint8Array(10);
  crypto.getRandomValues(randomBytes);
  const randomChars: string[] = [];
  for (let i = 0; i < 16; i++) {
    const byteIndex = Math.floor((i * 5) / 8);
    const bitOffset = (i * 5) % 8;
    let val = (randomBytes[byteIndex]! >> (8 - bitOffset - 5)) & 0x1f;
    if (bitOffset > 3) {
      val =
        ((randomBytes[byteIndex]! << (bitOffset - 3)) |
          (randomBytes[byteIndex + 1]! >> (11 - bitOffset))) &
        0x1f;
    }
    randomChars.push(CROCKFORD_BASE32[val & 0x1f]!);
  }

  return timeChars.join("") + randomChars.join("");
}

function execute(input: Input): Output {
  const ulids: string[] = [];
  for (let i = 0; i < input.count; i++) {
    ulids.push(generateUlid());
  }
  return { output: ulids.join("\n") };
}

export const ulidGenerator = defineTool({
  meta: {
    id: "identifiers/ulid-generator",
    name: "ULID Generator",
    description:
      "Free online ULID generator — create Universally Unique Lexicographically Sortable Identifiers instantly in your browser. No data is stored. Generates 26-character Crockford base32-encoded IDs with embedded millisecond timestamp for natural sort order.",
    category: "identifiers",
    tier: ToolTier.CLIENT,
    keywords: [
      "ulid",
      "generate",
      "sortable",
      "identifier",
      "unique",
      "crockford",
      "base32",
    ],
    examples: [
      {
        title: "Single ULID",
        description: "Generate one lexicographically sortable ULID",
        input: { count: 1 },
        output: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
      },
      {
        title: "Batch ULIDs",
        description: "Generate 3 ULIDs for time-ordered database records",
        input: { count: 3 },
        output:
          "01ARZ3NDEKTSV4RRFFQ69G5FAV\n01ARZ3NDEKTSV4RRFFQ69G5FAW\n01ARZ3NDEKTSV4RRFFQ69G5FAX",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
