import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Password to derive key from"),
  salt: z.string().default("").describe("Salt for key derivation"),
});

const outputSchema = z.object({
  output: z.string().describe("Derived key as hex string"),
});

const optionsSchema = z.object({
  iterations: z
    .number()
    .min(1)
    .max(1000000)
    .default(100000)
    .describe("Number of iterations"),
  keyLength: z
    .number()
    .min(16)
    .max(512)
    .default(256)
    .describe("Output key length in bits"),
  hash: z
    .enum(["SHA-256", "SHA-512"])
    .default("SHA-256")
    .describe("Hash algorithm"),
});

export const pbkdf2 = defineTool({
  meta: {
    id: "crypto/pbkdf2",
    name: "PBKDF2",
    description:
      "Free online PBKDF2 key derivation tool — derive cryptographic keys from passwords instantly in your browser. No data is stored. Supports SHA-256 and SHA-512 with configurable iterations and key length.",
    category: "crypto",
    subgroup: "HMAC & KDF",
    tier: ToolTier.CLIENT,
    keywords: ["pbkdf2", "kdf", "key", "derivation", "password", "crypto"],
    icon: "Key",
    examples: [
      {
        title: "Derive Key",
        description:
          "Derive a 256-bit key from a password and salt using PBKDF2",
        input: { input: "MyPassword123", salt: "random-salt-value" },
        output:
          "(64-character hex derived key — output is deterministic when the same password, salt, iterations, and hash are used)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute: async (input, options) => {
    const iterations = options?.iterations ?? 100000;
    const keyLength = options?.keyLength ?? 256;
    const hash = options?.hash ?? "SHA-256";
    const encoder = new TextEncoder();

    const passwordKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(input.input),
      "PBKDF2",
      false,
      ["deriveBits"]
    );

    const salt = encoder.encode(input.salt || "");

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations,
        hash,
      },
      passwordKey,
      keyLength
    );

    const bytes = new Uint8Array(derivedBits);
    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return { output: hex };
  },
});
