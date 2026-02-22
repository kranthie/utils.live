import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Base64-encoded ciphertext to decrypt"),
  privateKey: z.string().describe("RSA private key in JWK JSON format"),
});

const outputSchema = z.object({
  output: z.string().describe("Decrypted plaintext"),
});

export const rsaDecrypt = defineTool({
  meta: {
    id: "crypto/rsa-decrypt",
    name: "RSA-OAEP Decrypt",
    description:
      "Free online RSA-OAEP decryption tool — decrypt RSA-OAEP ciphertext instantly in your browser. No data is stored. Accepts RSA private keys in JWK format and decodes Base64-encoded ciphertext.",
    category: "crypto",
    subgroup: "Encryption",
    tier: ToolTier.CLIENT,
    keywords: [
      "rsa",
      "decrypt",
      "rsa-oaep",
      "asymmetric",
      "private-key",
      "crypto",
    ],
    icon: "Unlock",
    examples: [
      {
        title: "RSA Decrypt",
        description: "Decrypt RSA-OAEP ciphertext using the private key",
        input: {
          input: "(Base64-encoded ciphertext)",
          privateKey: '{"kty":"RSA","n":"...","e":"AQAB","d":"..."}',
        },
        output:
          "(Decrypted plaintext — requires valid Base64 ciphertext from RSA-OAEP Encrypt with the matching private key)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: async (input) => {
    const decoder = new TextDecoder();

    let cipherBytes: Uint8Array;
    try {
      const binary = atob(input.input);
      cipherBytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        cipherBytes[i] = binary.charCodeAt(i);
      }
    } catch {
      throw new Error("Invalid base64 ciphertext");
    }

    let jwk: JsonWebKey;
    try {
      jwk = JSON.parse(input.privateKey) as Record<string, unknown>;
    } catch {
      throw new Error("Invalid JWK format: private key must be valid JSON");
    }

    const privateKey = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSA-OAEP", hash: "SHA-256" },
      false,
      ["decrypt"]
    );

    try {
      const plaintext = await crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        privateKey,
        new Uint8Array(cipherBytes).buffer
      );
      return { output: decoder.decode(plaintext) };
    } catch {
      throw new Error("Decryption failed: invalid key or corrupted ciphertext");
    }
  },
});
