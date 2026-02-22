import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  length: z.number().min(2).max(32).default(24).describe("Length of the CUID2"),
  count: z
    .number()
    .min(1)
    .max(100)
    .default(1)
    .describe("Number of CUID2s to generate"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated CUID2(s)"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

async function sha256Hex(data: string): Promise<string> {
  const buffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(data)
  );
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

let globalCounter = Math.floor(Math.random() * 2147483647);

function createEntropy(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => ALPHABET[b % ALPHABET.length])
    .join("");
}

async function generateCuid2(length: number): Promise<string> {
  const time = Date.now().toString(36);
  const count = (globalCounter++).toString(36);
  const entropy = createEntropy(length);
  const salt = createEntropy(length);

  const input = `${time}${salt}${count}${entropy}`;
  const hash = await sha256Hex(input);

  // Convert hash to lowercase alpha chars for output
  const firstChar = ALPHABET[Math.floor(Math.random() * ALPHABET.length)]!;
  let result = firstChar;

  // Use hash bytes to produce characters from the alphabet
  for (let i = 0; i < hash.length && result.length < length; i += 2) {
    const byte = parseInt(hash.substring(i, i + 2), 16);
    result += ALPHABET[byte % ALPHABET.length];
  }

  // If we still need more characters, pad with random
  while (result.length < length) {
    result += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }

  return result.substring(0, length);
}

async function execute(input: Input): Promise<Output> {
  const ids: string[] = [];
  for (let i = 0; i < input.count; i++) {
    ids.push(await generateCuid2(input.length));
  }
  return { output: ids.join("\n") };
}

export const cuid2Generator = defineTool({
  meta: {
    id: "identifiers/cuid2-generator",
    name: "CUID2 Generator",
    description:
      "Free online CUID2 generator — create secure, collision-resistant identifiers instantly in your browser. No data is stored. Generates CUID2 format IDs using SHA-256 hashing with configurable length (2–32 chars) and batch generation up to 100.",
    category: "identifiers",
    tier: ToolTier.CLIENT,
    keywords: [
      "cuid2",
      "generate",
      "secure",
      "collision-resistant",
      "identifier",
      "sha256",
      "database",
      "primary-key",
    ],
    examples: [
      {
        title: "Default CUID2",
        description: "Generate a 24-character CUID2",
        input: { length: 24, count: 1 },
        output: "ckljzpkwz000001jqd5xr8bgh",
      },
      {
        title: "Short CUID2 Batch",
        description: "Generate 3 short 10-character CUID2 identifiers",
        input: { length: 10, count: 3 },
        output: "abcdefghij\nklmnopqrst\nuvwxyzabcd",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
