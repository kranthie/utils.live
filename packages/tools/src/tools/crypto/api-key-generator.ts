import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  prefix: z
    .string()
    .default("")
    .describe("Key prefix (e.g., 'sk_test_', 'pk_')"),
  length: z
    .number()
    .min(16)
    .max(128)
    .default(32)
    .describe("Key length (excluding prefix)"),
  format: z
    .enum(["hex", "base64", "alphanumeric", "base62"])
    .default("base62")
    .describe("Key format"),
  count: z
    .number()
    .min(1)
    .max(20)
    .default(1)
    .describe("Number of keys to generate"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated API key(s)"),
});

const BASE62_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const ALPHANUMERIC_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function secureRandomInt(max: number): number {
  const array = new Uint32Array(1);
  // Rejection sampling to eliminate modulo bias
  const limit = Math.floor(0x100000000 / max) * max;
  do {
    crypto.getRandomValues(array);
  } while (array[0]! >= limit);
  return array[0]! % max;
}

export const apiKeyGenerator = defineTool({
  meta: {
    id: "crypto/api-key-generator",
    name: "API Key Generator",
    description:
      "Free online API key generator — generate secure random API keys instantly in your browser. No data is stored. Supports hex, Base64, alphanumeric, and Base62 formats with configurable prefix and length.",
    category: "crypto",
    subgroup: "Password Tools",
    tier: ToolTier.CLIENT,
    keywords: ["api", "key", "token", "generate", "random", "secret", "crypto"],
    icon: "Key",
    examples: [
      {
        title: "Stripe-style API Key",
        description: "Generate a Base62 API key with a prefix like Stripe",
        input: { prefix: "sk_test_", length: 32, format: "base62", count: 1 },
        output:
          "(Random Base62 API key with prefix, e.g., sk_test_aBcDeFgHiJkLmNoPqRsTuVwXyZ012345)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const keys: string[] = [];

    for (let n = 0; n < input.count; n++) {
      let key: string;

      switch (input.format) {
        case "hex": {
          const bytes = new Uint8Array(Math.ceil(input.length / 2));
          crypto.getRandomValues(bytes);
          key = Array.from(bytes)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("")
            .substring(0, input.length);
          break;
        }

        case "base64": {
          const bytes = new Uint8Array(Math.ceil((input.length * 3) / 4));
          crypto.getRandomValues(bytes);
          let binary = "";
          for (const byte of bytes) {
            binary += String.fromCharCode(byte);
          }
          key = btoa(binary).replace(/[+/=]/g, "").substring(0, input.length);
          // Pad if needed (unlikely but possible)
          while (key.length < input.length) {
            const extraBytes = new Uint8Array(3);
            crypto.getRandomValues(extraBytes);
            let extraBinary = "";
            for (const b of extraBytes) {
              extraBinary += String.fromCharCode(b);
            }
            key += btoa(extraBinary).replace(/[+/=]/g, "");
          }
          key = key.substring(0, input.length);
          break;
        }

        case "alphanumeric": {
          key = "";
          for (let i = 0; i < input.length; i++) {
            key +=
              ALPHANUMERIC_CHARS[secureRandomInt(ALPHANUMERIC_CHARS.length)];
          }
          break;
        }

        case "base62":
        default: {
          key = "";
          for (let i = 0; i < input.length; i++) {
            key += BASE62_CHARS[secureRandomInt(BASE62_CHARS.length)];
          }
          break;
        }
      }

      keys.push(input.prefix + key);
    }

    return { output: keys.join("\n") };
  },
});
