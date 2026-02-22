import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Key data in JWK JSON, PEM, or hex format"),
});

const outputSchema = z.object({
  output: z.string().describe("Converted key information"),
});

const optionsSchema = z.object({
  outputFormat: z
    .enum(["jwk", "pem", "info"])
    .default("info")
    .describe("Output format"),
});

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function formatPem(b64: string, label: string): string {
  const lines: string[] = [];
  lines.push(`-----BEGIN ${label}-----`);
  for (let i = 0; i < b64.length; i += 64) {
    lines.push(b64.substring(i, i + 64));
  }
  lines.push(`-----END ${label}-----`);
  return lines.join("\n");
}

export const jwkConverter = defineTool({
  meta: {
    id: "crypto/jwk-converter",
    name: "JWK Converter",
    description:
      "Free online JWK converter — convert and inspect JSON Web Keys instantly in your browser. No data is stored. Supports RSA, EC, and OKP key types with JWK info, PEM export, and key metadata display.",
    category: "crypto",
    subgroup: "Keys & Certificates",
    tier: ToolTier.CLIENT,
    keywords: ["jwk", "key", "convert", "json", "pem", "crypto"],
    icon: "ArrowLeftRight",
    examples: [
      {
        title: "Inspect JWK",
        description: "Display information about a JSON Web Key",
        input:
          '{"kty":"EC","crv":"P-256","x":"f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU","y":"x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0"}',
        output:
          "=== JWK Key Information ===\nKey Type (kty): EC\nType: Elliptic Curve Key\nCurve: P-256\nContains: Public key only",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute: async (input, options) => {
    const outputFormat = options?.outputFormat ?? "info";
    const trimmed = input.input.trim();

    // Try to parse as JWK
    let jwk: JsonWebKey;
    try {
      jwk = JSON.parse(trimmed) as Record<string, unknown>;
    } catch {
      throw new Error(
        "Input must be valid JWK JSON. PEM-to-JWK conversion requires importing the key first."
      );
    }

    if (!jwk.kty) {
      throw new Error("Invalid JWK: missing 'kty' (key type) field");
    }

    if (outputFormat === "info") {
      const info: string[] = ["=== JWK Key Information ==="];
      info.push(`Key Type (kty): ${jwk.kty}`);
      if (jwk.alg) info.push(`Algorithm (alg): ${jwk.alg}`);
      if (jwk.use) info.push(`Usage (use): ${jwk.use}`);
      if (jwk.key_ops)
        info.push(`Operations (key_ops): ${jwk.key_ops.join(", ")}`);
      if ((jwk as Record<string, unknown>)["kid"])
        info.push(
          `Key ID (kid): ${String((jwk as Record<string, unknown>)["kid"])}`
        );

      if (jwk.kty === "RSA") {
        info.push(`Type: RSA Key`);
        if (jwk.n) {
          const nBytes = Math.ceil((jwk.n.length * 6) / 8);
          info.push(`Modulus size: ~${nBytes * 8} bits`);
        }
        if (jwk.d) {
          info.push("Contains: Private key (has 'd' component)");
        } else {
          info.push("Contains: Public key only");
        }
      } else if (jwk.kty === "EC") {
        info.push(`Type: Elliptic Curve Key`);
        if (jwk.crv) info.push(`Curve: ${jwk.crv}`);
        if (jwk.d) {
          info.push("Contains: Private key (has 'd' component)");
        } else {
          info.push("Contains: Public key only");
        }
      } else if (jwk.kty === "oct") {
        info.push("Type: Symmetric Key");
        if (jwk.k) {
          const kBytes = Math.ceil((jwk.k.length * 6) / 8);
          info.push(`Key size: ~${kBytes * 8} bits`);
        }
      } else if (jwk.kty === "OKP") {
        info.push("Type: Octet Key Pair (EdDSA/X25519)");
        if (jwk.crv) info.push(`Curve: ${jwk.crv}`);
      }

      return { output: info.join("\n") };
    }

    if (outputFormat === "jwk") {
      return { output: JSON.stringify(jwk, null, 2) };
    }

    // PEM output - import and re-export
    if (outputFormat === "pem") {
      try {
        if (jwk.kty === "RSA") {
          const algo = { name: "RSA-OAEP", hash: "SHA-256" };
          const isPrivate = !!jwk.d;
          const key = await crypto.subtle.importKey(
            "jwk",
            jwk,
            algo,
            true,
            isPrivate ? ["decrypt"] : ["encrypt"]
          );
          const exported = isPrivate
            ? await crypto.subtle.exportKey("pkcs8", key)
            : await crypto.subtle.exportKey("spki", key);
          const label = isPrivate ? "PRIVATE KEY" : "PUBLIC KEY";
          return { output: formatPem(arrayBufferToBase64(exported), label) };
        } else if (jwk.kty === "EC") {
          const isPrivate = !!jwk.d;
          const key = await crypto.subtle.importKey(
            "jwk",
            jwk,
            { name: "ECDSA", namedCurve: jwk.crv as string },
            true,
            isPrivate ? ["sign"] : ["verify"]
          );
          const exported = isPrivate
            ? await crypto.subtle.exportKey("pkcs8", key)
            : await crypto.subtle.exportKey("spki", key);
          const label = isPrivate ? "EC PRIVATE KEY" : "PUBLIC KEY";
          return { output: formatPem(arrayBufferToBase64(exported), label) };
        }
        throw new Error(`PEM export not supported for key type: ${jwk.kty}`);
      } catch (e) {
        if (e instanceof Error && e.message.startsWith("PEM export")) throw e;
        throw new Error(`Failed to convert to PEM: ${(e as Error).message}`);
      }
    }

    return { output: JSON.stringify(jwk, null, 2) };
  },
});
