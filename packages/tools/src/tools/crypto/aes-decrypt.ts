import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z
    .string()
    .describe("Base64-encoded ciphertext (from AES-GCM encrypt)"),
  key: z
    .string()
    .min(1)
    .describe("Decryption key (same key used for encryption)"),
});

const outputSchema = z.object({
  output: z.string().describe("Decrypted plaintext"),
});

const optionsSchema = z.object({
  keySize: z
    .enum(["128", "256"])
    .default("256")
    .describe("AES key size in bits"),
});

export const aesDecrypt = defineTool({
  meta: {
    id: "crypto/aes-decrypt",
    name: "AES-GCM Decrypt",
    description:
      "Free online AES-GCM decryption tool — decrypt AES-GCM ciphertext instantly in your browser. No data is stored. Supports AES-128 and AES-256 with PBKDF2 key derivation from a password.",
    category: "crypto",
    subgroup: "Encryption",
    tier: ToolTier.CLIENT,
    keywords: [
      "aes",
      "decrypt",
      "aes-gcm",
      "decryption",
      "crypto",
      "symmetric",
    ],
    icon: "Unlock",
    examples: [
      {
        title: "Decrypt Message",
        description: "Decrypt AES-GCM ciphertext using the original password",
        input: {
          input: "(Base64-encoded ciphertext from AES-GCM Encrypt)",
          key: "MySecretKey123!",
        },
        output:
          "(Decrypted plaintext — requires valid Base64 ciphertext from AES-GCM Encrypt with the correct key)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute: async (input, options) => {
    const keySize = parseInt(options?.keySize ?? "256", 10);
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // Decode base64 input
    let combined: Uint8Array;
    try {
      const binary = atob(input.input);
      combined = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        combined[i] = binary.charCodeAt(i);
      }
    } catch {
      throw new Error("Invalid base64 input");
    }

    if (combined.length < 29) {
      throw new Error(
        "Ciphertext too short (must include 16-byte salt + 12-byte IV)"
      );
    }

    // Extract salt (first 16 bytes), IV (next 12 bytes), and ciphertext
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const ciphertext = combined.slice(28);

    // Derive key using same parameters as encrypt
    const passwordKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(input.key),
      "PBKDF2",
      false,
      ["deriveKey"]
    );

    const aesKey = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      passwordKey,
      { name: "AES-GCM", length: keySize },
      false,
      ["decrypt"]
    );

    try {
      const plaintext = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        aesKey,
        ciphertext
      );
      return { output: decoder.decode(plaintext) };
    } catch {
      throw new Error("Decryption failed: invalid key or corrupted ciphertext");
    }
  },
});
