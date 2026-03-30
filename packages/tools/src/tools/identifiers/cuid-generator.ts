import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const BASE36_CHARS = "0123456789abcdefghijklmnopqrstuvwxyz";

let counter = 0;

function toBase36(num: number, padLen: number): string {
  let result = "";
  let n = Math.abs(num);
  do {
    result = BASE36_CHARS[n % 36]! + result;
    n = Math.floor(n / 36);
  } while (n > 0);
  return result.padStart(padLen, "0");
}

function randomBlock(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const num =
    ((bytes[0]! << 24) | (bytes[1]! << 16) | (bytes[2]! << 8) | bytes[3]!) >>>
    0;
  return toBase36(num % 1679616, 4); // max 4 base36 chars
}

function fingerprint(): string {
  // Simple fingerprint based on random values (no process.pid in browser)
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const num = ((bytes[0]! << 8) | bytes[1]!) >>> 0;
  const num2 = ((bytes[2]! << 8) | bytes[3]!) >>> 0;
  return (
    toBase36(num % 36, 1) +
    toBase36(num2 % 36, 1) +
    toBase36((num + num2) % 1296, 2)
  );
}

function generateCuid(): string {
  const timestamp = toBase36(Date.now(), 8);
  // Wrap at 36^4 = 1,679,616 to keep the counter always exactly 4 base36 chars
  const count = toBase36(counter++ % 1679616, 4);
  const fp = fingerprint();
  const rand1 = randomBlock();
  const rand2 = randomBlock();

  return "c" + timestamp + count + fp + rand1 + rand2;
}

const inputSchema = z.object({
  count: z
    .number()
    .min(1)
    .max(100)
    .default(1)
    .describe("Number of CUIDs to generate"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated CUID(s)"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const ids: string[] = [];
  for (let i = 0; i < input.count; i++) {
    ids.push(generateCuid());
  }
  return { output: ids.join("\n") };
}

export const cuidGenerator = defineTool({
  meta: {
    id: "identifiers/cuid-generator",
    name: "CUID Generator",
    description:
      "Free online CUID generator — create collision-resistant unique identifiers instantly in your browser. No data is stored. Generates CUID v1 format IDs with embedded timestamp, counter, fingerprint, and random blocks for horizontal scalability.",
    category: "identifiers",
    tier: ToolTier.CLIENT,
    keywords: [
      "cuid",
      "generate",
      "collision-resistant",
      "identifier",
      "node",
      "database",
      "primary-key",
    ],
    examples: [
      {
        title: "Single CUID",
        description: "Generate one collision-resistant CUID",
        input: { count: 1 },
        output: "clpfz0x1a000008jq3v5r9g2h",
      },
      {
        title: "Multiple CUIDs",
        description: "Generate 3 CUIDs for use as database primary keys",
        input: { count: 3 },
        output:
          "clpfz0x1a000008jq3v5r9g2h\nclpfz0x1b000108jq4w6s0h3i\nclpfz0x1c000208jq5x7t1i4j",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
