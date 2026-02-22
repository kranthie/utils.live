import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

let objectIdCounter = Math.floor(Math.random() * 0xffffff);

const inputSchema = z.object({
  count: z
    .number()
    .min(1)
    .max(100)
    .default(1)
    .describe("Number of ObjectIDs to generate"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated ObjectID(s)"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function generateObjectId(): string {
  // MongoDB ObjectID: 12 bytes
  // 4 bytes timestamp + 5 bytes random + 3 bytes counter
  const timestamp = Math.floor(Date.now() / 1000);
  const randomBytes = new Uint8Array(5);
  crypto.getRandomValues(randomBytes);
  const counter = objectIdCounter++ & 0xffffff;

  const bytes = new Uint8Array(12);
  // Timestamp (4 bytes, big-endian)
  bytes[0] = (timestamp >> 24) & 0xff;
  bytes[1] = (timestamp >> 16) & 0xff;
  bytes[2] = (timestamp >> 8) & 0xff;
  bytes[3] = timestamp & 0xff;
  // Random (5 bytes)
  bytes.set(randomBytes, 4);
  // Counter (3 bytes, big-endian)
  bytes[9] = (counter >> 16) & 0xff;
  bytes[10] = (counter >> 8) & 0xff;
  bytes[11] = counter & 0xff;

  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function execute(input: Input): Output {
  const ids: string[] = [];
  for (let i = 0; i < input.count; i++) {
    ids.push(generateObjectId());
  }
  return { output: ids.join("\n") };
}

export const objectidGenerator = defineTool({
  meta: {
    id: "identifiers/objectid-generator",
    name: "ObjectID Generator",
    description:
      "Free online MongoDB ObjectID generator — create 24-character hex identifiers instantly in your browser. No data is stored. Generates valid ObjectIDs with embedded timestamp, random bytes, and incrementing counter following the BSON specification.",
    category: "identifiers",
    tier: ToolTier.CLIENT,
    keywords: [
      "objectid",
      "mongodb",
      "generate",
      "identifier",
      "bson",
      "mongoose",
      "database",
    ],
    examples: [
      {
        title: "Single ObjectID",
        description: "Generate one MongoDB-style ObjectID",
        input: { count: 1 },
        output: "65a3f1b2c4d5e6f7a8b9c0d1",
      },
      {
        title: "Batch ObjectIDs",
        description: "Generate 3 ObjectIDs for database seeding",
        input: { count: 3 },
        output:
          "65a3f1b2c4d5e6f7a8b9c0d1\n65a3f1b2c4d5e6f7a8b9c0d2\n65a3f1b2c4d5e6f7a8b9c0d3",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
