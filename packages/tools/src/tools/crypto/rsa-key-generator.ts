import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  modulusLength: z
    .enum(["2048", "4096"])
    .default("2048")
    .describe("RSA modulus length in bits"),
  format: z.enum(["jwk", "pkcs8"]).default("jwk").describe("Output key format"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated RSA key pair"),
});

export const rsaKeyGenerator = defineTool({
  meta: {
    id: "crypto/rsa-key-generator",
    name: "RSA Key Generator",
    description:
      "Free online RSA key pair generator — generate RSA-2048 and RSA-4096 key pairs instantly in your browser. No data is stored. Outputs in JWK or PEM (PKCS#8/SPKI) format using the Web Crypto API.",
    category: "crypto",
    subgroup: "Keys & Certificates",
    tier: ToolTier.CLIENT,
    keywords: [
      "rsa",
      "key",
      "keypair",
      "generate",
      "public",
      "private",
      "crypto",
    ],
    icon: "Key",
    examples: [
      {
        title: "Generate 2048-bit RSA Key Pair",
        description:
          "Generate an RSA key pair in JWK format for encryption or signing",
        input: { modulusLength: "2048", format: "jwk" },
        output:
          "(RSA-2048 key pair in JWK format — output varies due to random key generation)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: async (input) => {
    const modulusLength = parseInt(input.modulusLength, 10);

    const keyPair = await crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"]
    );

    if (input.format === "jwk") {
      const publicJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
      const privateJwk = await crypto.subtle.exportKey(
        "jwk",
        keyPair.privateKey
      );

      const output = [
        "=== Public Key (JWK) ===",
        JSON.stringify(publicJwk, null, 2),
        "",
        "=== Private Key (JWK) ===",
        JSON.stringify(privateJwk, null, 2),
      ].join("\n");

      return { output };
    } else {
      // PKCS8/SPKI format as base64
      const publicSpki = await crypto.subtle.exportKey(
        "spki",
        keyPair.publicKey
      );
      const privatePkcs8 = await crypto.subtle.exportKey(
        "pkcs8",
        keyPair.privateKey
      );

      const arrayBufferToBase64 = function (buffer: ArrayBuffer): string {
        let binary = "";
        const bytes = new Uint8Array(buffer);
        for (const byte of bytes) {
          binary += String.fromCharCode(byte);
        }
        return btoa(binary);
      };

      const formatPem = function (b64: string, label: string): string {
        const lines: string[] = [];
        lines.push(`-----BEGIN ${label}-----`);
        for (let i = 0; i < b64.length; i += 64) {
          lines.push(b64.substring(i, i + 64));
        }
        lines.push(`-----END ${label}-----`);
        return lines.join("\n");
      };

      const publicPem = formatPem(
        arrayBufferToBase64(publicSpki),
        "PUBLIC KEY"
      );
      const privatePem = formatPem(
        arrayBufferToBase64(privatePkcs8),
        "PRIVATE KEY"
      );

      return {
        output: `${publicPem}\n\n${privatePem}`,
      };
    }
  },
});
