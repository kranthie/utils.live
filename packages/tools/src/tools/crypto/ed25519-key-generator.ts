import { z } from "zod";
import * as ed from "@noble/ed25519";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  format: z
    .enum(["hex", "base64"])
    .default("hex")
    .describe("Output key format"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated Ed25519 key pair"),
});

export const ed25519KeyGenerator = defineTool({
  meta: {
    id: "crypto/ed25519-key-generator",
    name: "Ed25519 Key Generator",
    description:
      "Free online Ed25519 key pair generator — generate Ed25519 signing key pairs instantly in your browser. No data is stored. Outputs 32-byte private and public keys in hex or Base64 format.",
    category: "crypto",
    subgroup: "Keys & Certificates",
    tier: ToolTier.CLIENT,
    keywords: [
      "ed25519",
      "key",
      "keypair",
      "generate",
      "signing",
      "crypto",
      "edwards",
    ],
    icon: "Key",
    examples: [
      {
        title: "Generate Ed25519 Key Pair",
        description: "Generate an Ed25519 signing key pair in hex format",
        input: { format: "hex" },
        output:
          "(Ed25519 key pair in hex format — output varies due to random key generation)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: async (input) => {
    // Generate a real Ed25519 key pair using @noble/ed25519
    const keys = await ed.keygenAsync();

    function toHex(bytes: Uint8Array): string {
      return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }

    function toBase64(bytes: Uint8Array): string {
      let binary = "";
      for (const byte of bytes) {
        binary += String.fromCharCode(byte);
      }
      return btoa(binary);
    }

    const fmt = input.format === "base64" ? toBase64 : toHex;

    const lines = [
      "=== Ed25519 Private Key (Seed) ===",
      fmt(keys.secretKey),
      "",
      "=== Ed25519 Public Key ===",
      fmt(keys.publicKey),
      "",
      `Format: ${input.format}`,
      `Private key: 32 bytes (256 bits)`,
      `Public key: 32 bytes (256 bits)`,
    ];

    return { output: lines.join("\n") };
  },
});
