import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const ALPHABETS: Record<string, string> = {
  alphanumeric:
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  lowercase: "0123456789abcdefghijklmnopqrstuvwxyz",
  uppercase: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  numbers: "0123456789",
  hex: "0123456789abcdef",
  urlsafe: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_",
};

const inputSchema = z.object({
  length: z
    .number()
    .min(2)
    .max(64)
    .default(8)
    .describe("Length of the short ID"),
  count: z
    .number()
    .min(1)
    .max(100)
    .default(1)
    .describe("Number of IDs to generate"),
  alphabet: z
    .enum([
      "alphanumeric",
      "lowercase",
      "uppercase",
      "numbers",
      "hex",
      "urlsafe",
    ])
    .default("alphanumeric")
    .describe("Character set for ID generation"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated short ID(s)"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function generateShortId(length: number, alphabet: string): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let id = "";
  for (let i = 0; i < length; i++) {
    id += alphabet[bytes[i]! % alphabet.length];
  }
  return id;
}

function execute(input: Input): Output {
  const alphabet = ALPHABETS[input.alphabet]!;
  const ids: string[] = [];
  for (let i = 0; i < input.count; i++) {
    ids.push(generateShortId(input.length, alphabet));
  }
  return { output: ids.join("\n") };
}

export const shortIdGenerator = defineTool({
  meta: {
    id: "identifiers/short-id-generator",
    name: "Short ID Generator",
    description:
      "Free online short ID generator — create compact, URL-friendly identifiers instantly in your browser. No data is stored. Supports alphanumeric, lowercase, uppercase, numeric, hex, and URL-safe alphabets with configurable length (2–64 chars).",
    category: "identifiers",
    tier: ToolTier.CLIENT,
    keywords: [
      "short",
      "id",
      "generate",
      "compact",
      "url-safe",
      "slug",
      "link-shortener",
    ],
    examples: [
      {
        title: "Default Short ID",
        description: "Generate an 8-character alphanumeric short ID",
        input: { length: 8, count: 1, alphabet: "alphanumeric" },
        output: "xK9mB3pQ",
      },
      {
        title: "Lowercase Hex IDs",
        description: "Generate 3 hex-only 12-character short IDs",
        input: { length: 12, count: 3, alphabet: "hex" },
        output: "a3f1b2c4d5e6\n7f8a9b0c1d2e\n3e4f5a6b7c8d",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
