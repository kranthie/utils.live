import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Plaintext to encrypt"),
  publicKey: z.string().describe("RSA public key in JWK JSON format"),
});

const outputSchema = z.object({
  output: z.string().describe("Encrypted data as base64"),
});

export const rsaEncrypt = defineTool({
  meta: {
    id: "crypto/rsa-encrypt",
    name: "RSA-OAEP Encrypt",
    description:
      "Free online RSA-OAEP encryption tool — encrypt text with RSA-OAEP instantly in your browser. No data is stored. Accepts RSA public keys in JWK format and produces Base64-encoded ciphertext.",
    category: "crypto",
    subgroup: "Encryption",
    tier: ToolTier.CLIENT,
    keywords: [
      "rsa",
      "encrypt",
      "rsa-oaep",
      "asymmetric",
      "public-key",
      "crypto",
    ],
    icon: "Lock",
    examples: [
      {
        title: "RSA Encrypt",
        description: "Encrypt a message using an RSA public key in JWK format",
        input: {
          input: "Secret message",
          publicKey: '{"kty":"RSA","n":"...","e":"AQAB"}',
        },
        output:
          "(Base64-encoded RSA-OAEP ciphertext — output varies due to random OAEP padding)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: async (input) => {
    const encoder = new TextEncoder();

    let jwk: JsonWebKey;
    try {
      jwk = JSON.parse(input.publicKey) as Record<string, unknown>;
    } catch {
      throw new Error("Invalid JWK format: public key must be valid JSON");
    }

    const publicKey = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSA-OAEP", hash: "SHA-256" },
      false,
      ["encrypt"]
    );

    const ciphertext = await crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      publicKey,
      encoder.encode(input.input)
    );

    let binary = "";
    for (const byte of new Uint8Array(ciphertext)) {
      binary += String.fromCharCode(byte);
    }

    return { output: btoa(binary) };
  },
});
