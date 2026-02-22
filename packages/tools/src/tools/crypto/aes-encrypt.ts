import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Plaintext to encrypt"),
  key: z
    .string()
    .min(1)
    .describe("Encryption key (will be derived to proper length)"),
});

const outputSchema = z.object({
  output: z.string().describe("Encrypted data as base64 (iv:ciphertext)"),
});

const optionsSchema = z.object({
  keySize: z
    .enum(["128", "256"])
    .default("256")
    .describe("AES key size in bits"),
});

export const aesEncrypt = defineTool({
  meta: {
    id: "crypto/aes-encrypt",
    name: "AES-GCM Encrypt",
    description:
      "Free online AES-GCM encryption tool — encrypt text with AES-GCM instantly in your browser. No data is stored. Supports AES-128 and AES-256 key sizes with PBKDF2 key derivation and Base64 output.",
    category: "crypto",
    subgroup: "Encryption",
    tier: ToolTier.CLIENT,
    keywords: [
      "aes",
      "encrypt",
      "aes-gcm",
      "encryption",
      "crypto",
      "symmetric",
    ],
    icon: "Lock",
    examples: [
      {
        title: "Encrypt Message",
        description: "Encrypt a message with a password using AES-256-GCM",
        input: { input: "Secret message for Bob", key: "MySecretKey123!" },
        output:
          "(Base64-encoded AES-256-GCM ciphertext — output varies due to random IV and salt)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute: async (input, options) => {
    const keySize = parseInt(options?.keySize ?? "256", 10);
    const encoder = new TextEncoder();

    // Derive a proper-length key from the user's password using PBKDF2
    const passwordKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(input.key),
      "PBKDF2",
      false,
      ["deriveKey"]
    );

    // Generate random 16-byte salt per encryption operation
    const salt = new Uint8Array(16);
    crypto.getRandomValues(salt);

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
      ["encrypt"]
    );

    // Generate random IV (12 bytes for GCM)
    const iv = new Uint8Array(12);
    crypto.getRandomValues(iv);

    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      aesKey,
      encoder.encode(input.input)
    );

    // Combine salt + IV + ciphertext and encode as base64
    const combined = new Uint8Array(
      salt.length + iv.length + ciphertext.byteLength
    );
    combined.set(salt);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

    let binary = "";
    for (const byte of combined) {
      binary += String.fromCharCode(byte);
    }

    return { output: btoa(binary) };
  },
});
