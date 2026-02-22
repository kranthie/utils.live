import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Public key in PEM or JWK format"),
});

const outputSchema = z.object({
  output: z.string().describe("Key fingerprint(s)"),
});

export const keyFingerprint = defineTool({
  meta: {
    id: "crypto/key-fingerprint",
    name: "Key Fingerprint",
    description:
      "Free online key fingerprint calculator — compute SHA-256 and SHA-1 fingerprints of public keys instantly in your browser. No data is stored. Accepts PEM and JWK key formats with colon-separated and hex output.",
    category: "crypto",
    subgroup: "Keys & Certificates",
    tier: ToolTier.CLIENT,
    keywords: ["key", "fingerprint", "sha256", "sha1", "crypto", "identify"],
    icon: "Fingerprint",
    examples: [
      {
        title: "PEM Key Fingerprint",
        description: "Calculate SHA-256 and SHA-1 fingerprints of a public key",
        input:
          "-----BEGIN PUBLIC KEY-----\nMIIBIjANBg... (paste full PEM)\n-----END PUBLIC KEY-----",
        output:
          "(SHA-256 and SHA-1 fingerprints — paste a full PEM or JWK public key to compute fingerprints)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: async (input) => {
    const trimmed = input.input.trim();
    let keyBytes: Uint8Array;

    // Try PEM format first
    const pemMatch = trimmed.match(
      /-----BEGIN [A-Z ]+-----\s*([\s\S]*?)\s*-----END [A-Z ]+-----/
    );

    if (pemMatch) {
      const b64 = pemMatch[1]!.replace(/\s/g, "");
      const binary = atob(b64);
      keyBytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        keyBytes[i] = binary.charCodeAt(i);
      }
    } else {
      // Try JWK
      try {
        const jwk = JSON.parse(trimmed) as JsonWebKey;
        if (!jwk.kty) throw new Error("Not a valid JWK");

        // Import and export to get raw bytes
        let key: CryptoKey;
        if (jwk.kty === "RSA") {
          key = await crypto.subtle.importKey(
            "jwk",
            jwk,
            { name: "RSA-OAEP", hash: "SHA-256" },
            true,
            jwk.d ? ["decrypt"] : ["encrypt"]
          );
        } else if (jwk.kty === "EC") {
          key = await crypto.subtle.importKey(
            "jwk",
            jwk,
            { name: "ECDSA", namedCurve: jwk.crv as string },
            true,
            jwk.d ? ["sign"] : ["verify"]
          );
        } else {
          throw new Error(`Unsupported key type for fingerprint: ${jwk.kty}`);
        }

        const isPrivate = !!jwk.d;
        const exported = isPrivate
          ? await crypto.subtle.exportKey("pkcs8", key)
          : await crypto.subtle.exportKey("spki", key);
        keyBytes = new Uint8Array(exported);
      } catch (e) {
        if ((e as Error).message.includes("Unsupported key type")) throw e;
        throw new Error("Input must be a valid PEM or JWK key");
      }
    }

    // Compute fingerprints
    const keyBuffer = new Uint8Array(keyBytes).buffer;
    const [sha256Hash, sha1Hash] = await Promise.all([
      crypto.subtle.digest("SHA-256", keyBuffer),
      crypto.subtle.digest("SHA-1", keyBuffer),
    ]);

    function toColonHex(buffer: ArrayBuffer): string {
      return Array.from(new Uint8Array(buffer))
        .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
        .join(":");
    }

    function toHex(buffer: ArrayBuffer): string {
      return Array.from(new Uint8Array(buffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }

    const lines = [
      "=== Key Fingerprints ===",
      `Key size: ${keyBytes.length} bytes`,
      "",
      `SHA-256: ${toColonHex(sha256Hash)}`,
      `SHA-256 (hex): ${toHex(sha256Hash)}`,
      "",
      `SHA-1: ${toColonHex(sha1Hash)}`,
      `SHA-1 (hex): ${toHex(sha1Hash)}`,
    ];

    return { output: lines.join("\n") };
  },
});
