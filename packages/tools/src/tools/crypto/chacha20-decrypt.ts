import { z } from "zod";
import { chacha20poly1305 } from "@noble/ciphers/chacha.js";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z
    .string()
    .describe("Base64-encoded ciphertext (salt + nonce + ciphertext)"),
  key: z
    .string()
    .min(1)
    .describe("Decryption key (same key used for encryption)"),
});

const outputSchema = z.object({
  output: z.string().describe("Decrypted plaintext"),
});

export const chacha20Decrypt_ = defineTool({
  meta: {
    id: "crypto/chacha20-decrypt",
    name: "ChaCha20-Poly1305 Decrypt",
    description:
      "Free online ChaCha20-Poly1305 decryption tool — decrypt authenticated ciphertext instantly in your browser. No data is stored. Decrypts RFC 8439 ChaCha20-Poly1305 AEAD data with PBKDF2-derived keys.",
    category: "crypto",
    subgroup: "Encryption",
    tier: ToolTier.CLIENT,
    keywords: [
      "chacha20",
      "poly1305",
      "decrypt",
      "aead",
      "decryption",
      "crypto",
    ],
    icon: "Unlock",
    examples: [
      {
        title: "Decrypt ChaCha20",
        description:
          "Decrypt ChaCha20-Poly1305 ciphertext with the original key",
        input: {
          input: "(Base64-encoded ciphertext from ChaCha20 Encrypt)",
          key: "MySecretKey123!",
        },
        output:
          "(Decrypted plaintext — requires valid Base64 ciphertext from ChaCha20 Encrypt with the correct key)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: async (input) => {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // Decode base64
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

    // Format: 16-byte salt + 12-byte nonce + ciphertext + 16-byte tag
    if (combined.length < 45) {
      throw new Error(
        "Ciphertext too short (must include 16-byte salt, 12-byte nonce, and 16-byte auth tag)"
      );
    }

    // Extract salt (first 16 bytes), nonce (next 12 bytes), and ciphertext+tag
    const salt = combined.slice(0, 16);
    const nonce = combined.slice(16, 28);
    const ciphertext = combined.slice(28);

    // Derive 32-byte key from password using PBKDF2
    const passwordKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(input.key),
      "PBKDF2",
      false,
      ["deriveBits"]
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      passwordKey,
      256
    );
    const key = new Uint8Array(derivedBits);

    try {
      const cipher = chacha20poly1305(key, nonce);
      const plaintext = cipher.decrypt(ciphertext);
      return { output: decoder.decode(plaintext) };
    } catch {
      throw new Error(
        "Decryption failed: invalid key, corrupted ciphertext, or authentication failure"
      );
    }
  },
});
