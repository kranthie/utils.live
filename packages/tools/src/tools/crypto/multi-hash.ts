import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to hash with multiple algorithms"),
});

const outputSchema = z.object({
  output: z.string().describe("Multiple hash results"),
});

async function computeWebCryptoHash(
  algorithm: string,
  data: BufferSource
): Promise<string> {
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const multiHash = defineTool({
  meta: {
    id: "crypto/multi-hash",
    name: "Multi Hash",
    description:
      "Free online multi-hash generator — compute SHA-1, SHA-256, SHA-384, and SHA-512 hashes at once instantly in your browser. No data is stored. Compare multiple hash algorithms side by side in a single operation.",
    category: "crypto",
    subgroup: "Hash Generators",
    tier: ToolTier.CLIENT,
    keywords: ["hash", "multi", "md5", "sha1", "sha256", "sha512", "digest"],
    icon: "Hash",
    examples: [
      {
        title: "Hash Text",
        description:
          "Generate SHA-1, SHA-256, SHA-384, and SHA-512 hashes at once",
        input: "hello",
        output:
          "SHA-1:   aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d\nSHA-256: 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824\nSHA-384: 59e1748777448c69de6b800d7a33bbfb9ff1b463e44354c3553bcdb9c666fa90125a3c79f90397bdf5f6a13de828684f\nSHA-512: 9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca72323c3d99ba5c11d7c7acc6e14b8c5da0c4663475c2e5c3adef46f73bcdec043",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: async (input) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(input.input);

    const [sha1, sha256, sha384, sha512] = await Promise.all([
      computeWebCryptoHash("SHA-1", data),
      computeWebCryptoHash("SHA-256", data),
      computeWebCryptoHash("SHA-384", data),
      computeWebCryptoHash("SHA-512", data),
    ]);

    const lines = [
      `SHA-1:   ${sha1}`,
      `SHA-256: ${sha256}`,
      `SHA-384: ${sha384}`,
      `SHA-512: ${sha512}`,
    ];

    return { output: lines.join("\n") };
  },
});
