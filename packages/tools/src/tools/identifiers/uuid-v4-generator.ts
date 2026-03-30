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
  uppercase: z
    .boolean()
    .default(false)
    .describe("Use uppercase hex characters"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated UUID(s)"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const uuids: string[] = [];
  for (let i = 0; i < input.count; i++) {
    let uuid: string = crypto.randomUUID();
    if (input.uppercase) {
      uuid = uuid.toUpperCase();
    }
    uuids.push(uuid);
  }
  return { output: uuids.join("\n") };
}

export const uuidV4Generator = defineTool({
  meta: {
    id: "identifiers/uuid-v4-generator",
    name: "UUID v4 Generator",
    description:
      "Free online UUID v4 generator — create cryptographically random UUID version 4 identifiers instantly in your browser. No data is stored. Uses Web Crypto API for secure randomness with optional uppercase output and batch generation up to 100.",
    category: "identifiers",
    tier: ToolTier.CLIENT,
    keywords: [
      "uuid",
      "v4",
      "generate",
      "random",
      "identifier",
      "guid",
      "rfc4122",
      "uuid generator online",
      "uuid v4 generator",
      "generate uuid",
    ],
    examples: [
      {
        title: "Single UUID v4",
        description: "Generate one random UUID v4",
        input: { count: 1, uppercase: false },
        output: "550e8400-e29b-41d4-a716-446655440000",
      },
      {
        title: "Uppercase UUID v4",
        description: "Generate 3 uppercase UUID v4 identifiers",
        input: { count: 3, uppercase: true },
        output:
          "550E8400-E29B-41D4-A716-446655440000\n6FA1C3D9-4B82-4F3E-9A28-7E2B5F84C601\n3D9B0F1A-82C4-4E57-B631-8A2E6D94F802",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
