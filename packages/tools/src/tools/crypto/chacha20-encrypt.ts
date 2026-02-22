import { z } from "zod";
import { chacha20poly1305 } from "@noble/ciphers/chacha.js";
import { randomBytes } from "@noble/ciphers/utils.js";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Plaintext to encrypt"),
  key: z
    .string()
    .min(1)
    .describe("Encryption key (will be derived via PBKDF2)"),
});

const outputSchema = z.object({
  output: z
    .string()
    .describe("Encrypted data as base64 (salt + nonce + ciphertext)"),
});

export const chacha20Encrypt_ = defineTool({
  meta: {
    id: "crypto/chacha20-encrypt",
    name: "ChaCha20-Poly1305 Encrypt",
    description:
      "Free online ChaCha20-Poly1305 encryption tool — encrypt text with authenticated encryption instantly in your browser. No data is stored. Uses RFC 8439 ChaCha20-Poly1305 AEAD with PBKDF2 key derivation and Base64 output.",
    category: "crypto",
    subgroup: "Encryption",
    tier: ToolTier.CLIENT,
    keywords: [
      "chacha20",
      "poly1305",
      "encrypt",
      "aead",
      "encryption",
      "crypto",
    ],
    icon: "Lock",
    examples: [
      {
        title: "Encrypt with ChaCha20",
        description:
          "Encrypt a message using ChaCha20-Poly1305 authenticated encryption",
        input: { input: "Top secret data", key: "MySecretKey123!" },
        output:
          "(Base64-encoded ChaCha20-Poly1305 ciphertext — output varies due to random nonce and salt)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: async (input) => {
    const encoder = new TextEncoder();

    // Generate random 16-byte salt for PBKDF2
    const salt = new Uint8Array(16);
    crypto.getRandomValues(salt);

    // Derive 32-byte key from user's password using PBKDF2
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

    // Generate random 12-byte nonce
    const nonce = randomBytes(12);

    const plaintext = encoder.encode(input.input);
    const cipher = chacha20poly1305(key, nonce);
    const ciphertext = cipher.encrypt(plaintext);

    // Combine salt + nonce + ciphertext (which includes the 16-byte Poly1305 tag)
    const combined = new Uint8Array(
      salt.length + nonce.length + ciphertext.length
    );
    combined.set(salt);
    combined.set(nonce, salt.length);
    combined.set(ciphertext, salt.length + nonce.length);

    let binary = "";
    for (const byte of combined) {
      binary += String.fromCharCode(byte);
    }

    return { output: btoa(binary) };
  },
});
