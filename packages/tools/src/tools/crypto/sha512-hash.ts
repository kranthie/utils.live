import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to hash with SHA-512"),
});

const outputSchema = z.object({
  output: z.string().describe("SHA-512 hash hex string"),
});

export const sha512Hash = defineTool({
  meta: {
    id: "crypto/sha512-hash",
    name: "SHA-512 Hash",
    description:
      "Free online SHA-512 hash generator — compute SHA-512 digests instantly in your browser. No data is stored. Produces a 128-character hex hash using the Web Crypto API for high-security cryptographic applications.",
    category: "crypto",
    subgroup: "Hash Generators",
    tier: ToolTier.CLIENT,
    keywords: ["sha512", "sha-512", "hash", "digest", "crypto", "sha2"],
    icon: "Hash",
    examples: [
      {
        title: "Hash Text",
        description: "Generate the SHA-512 digest of a string",
        input: "hello",
        output:
          "9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca72323c3d99ba5c11d7c7acc6e14b8c5da0c4663475c2e5c3adef46f73bcdec043",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: async (input) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(input.input);
    const hashBuffer = await crypto.subtle.digest("SHA-512", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return { output: hashHex };
  },
});
