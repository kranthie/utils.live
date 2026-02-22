import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  curve: z
    .enum(["P-256", "P-384", "P-521"])
    .default("P-256")
    .describe("Elliptic curve"),
  format: z.enum(["jwk", "pkcs8"]).default("jwk").describe("Output key format"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated EC key pair"),
});

export const ecKeyGenerator = defineTool({
  meta: {
    id: "crypto/ec-key-generator",
    name: "EC Key Generator",
    description:
      "Free online EC key pair generator — generate ECDSA key pairs instantly in your browser. No data is stored. Supports P-256, P-384, and P-521 curves with JWK and PEM (PKCS#8/SPKI) output formats.",
    category: "crypto",
    subgroup: "Keys & Certificates",
    tier: ToolTier.CLIENT,
    keywords: [
      "ec",
      "ecdsa",
      "elliptic-curve",
      "key",
      "keypair",
      "generate",
      "crypto",
      "p-256",
      "p-384",
    ],
    icon: "Key",
    examples: [
      {
        title: "Generate P-256 Key Pair",
        description: "Generate an ECDSA P-256 key pair in JWK format",
        input: { curve: "P-256", format: "jwk" },
        output:
          "(ECDSA P-256 key pair in JWK format — output varies due to random key generation)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: async (input) => {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: "ECDSA",
        namedCurve: input.curve,
      },
      true,
      ["sign", "verify"]
    );

    if (input.format === "jwk") {
      const publicJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
      const privateJwk = await crypto.subtle.exportKey(
        "jwk",
        keyPair.privateKey
      );

      const output = [
        `=== EC Public Key (${input.curve}, JWK) ===`,
        JSON.stringify(publicJwk, null, 2),
        "",
        `=== EC Private Key (${input.curve}, JWK) ===`,
        JSON.stringify(privateJwk, null, 2),
      ].join("\n");

      return { output };
    } else {
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
        "EC PRIVATE KEY"
      );

      return {
        output: `${publicPem}\n\n${privatePem}`,
      };
    }
  },
});
