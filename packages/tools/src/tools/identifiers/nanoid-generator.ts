import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const DEFAULT_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";

const inputSchema = z.object({
  length: z
    .number()
    .min(1)
    .max(256)
    .default(21)
    .describe("Length of the NanoID"),
  count: z
    .number()
    .min(1)
    .max(100)
    .default(1)
    .describe("Number of NanoIDs to generate"),
  alphabet: z
    .string()
    .default(DEFAULT_ALPHABET)
    .describe("Custom alphabet for ID generation"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated NanoID(s)"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function generateNanoid(length: number, alphabet: string): string {
  const mask = (2 << (31 - Math.clz32((alphabet.length - 1) | 1))) - 1;
  const step = Math.ceil((1.6 * mask * length) / alphabet.length);

  let id = "";
  while (id.length < length) {
    const bytes = new Uint8Array(step);
    crypto.getRandomValues(bytes);
    for (let i = 0; i < step && id.length < length; i++) {
      const idx = bytes[i]! & mask;
      if (idx < alphabet.length) {
        id += alphabet[idx];
      }
    }
  }

  return id;
}

function execute(input: Input): Output {
  const alphabet = input.alphabet || DEFAULT_ALPHABET;
  if (alphabet.length < 2) {
    throw new Error("Alphabet must contain at least 2 characters");
  }

  const ids: string[] = [];
  for (let i = 0; i < input.count; i++) {
    ids.push(generateNanoid(input.length, alphabet));
  }
  return { output: ids.join("\n") };
}

export const nanoidGenerator = defineTool({
  meta: {
    id: "identifiers/nanoid-generator",
    name: "NanoID Generator",
    description:
      "Free online NanoID generator — create compact, URL-friendly unique identifiers instantly in your browser. No data is stored. Supports custom alphabets, configurable length (1–256 chars), and batch generation with cryptographically secure randomness.",
    category: "identifiers",
    tier: ToolTier.CLIENT,
    keywords: [
      "nanoid",
      "generate",
      "compact",
      "url-safe",
      "identifier",
      "custom-alphabet",
      "crypto",
    ],
    examples: [
      {
        title: "Default NanoID",
        description: "Generate a 21-character NanoID with the default alphabet",
        input: {
          length: 21,
          count: 1,
          alphabet:
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-",
        },
        output: "V1StGXR8_Z5jdHi6B-myT",
      },
      {
        title: "Custom Numeric NanoID",
        description: "Generate 3 numeric-only 12-character NanoIDs",
        input: { length: 12, count: 3, alphabet: "0123456789" },
        output: "839471052637\n194826350741\n627305841926",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
