import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to hash with SHA-1"),
});

const outputSchema = z.object({
  output: z.string().describe("SHA-1 hash hex string"),
});

export const sha1Hash = defineTool({
  meta: {
    id: "crypto/sha1-hash",
    name: "SHA-1 Hash",
    description:
      "Free online SHA-1 hash generator — compute SHA-1 digests instantly in your browser. No data is stored. Produces a 40-character hex hash for checksums and non-security fingerprinting (deprecated for cryptographic use).",
    category: "crypto",
    subgroup: "Hash Generators",
    tier: ToolTier.CLIENT,
    keywords: ["sha1", "sha-1", "hash", "digest", "crypto"],
    icon: "Hash",
    examples: [
      {
        title: "Simple Hash",
        description: "Generate the SHA-1 digest of a short string",
        input: "hello",
        output: "aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: async (input) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(input.input);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return { output: hashHex };
  },
});
