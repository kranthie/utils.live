import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to hash with SHA-384"),
});

const outputSchema = z.object({
  output: z.string().describe("SHA-384 hash hex string"),
});

export const sha384Hash = defineTool({
  meta: {
    id: "crypto/sha384-hash",
    name: "SHA-384 Hash",
    description:
      "Free online SHA-384 hash generator — compute SHA-384 digests instantly in your browser. No data is stored. Produces a 96-character hex hash using the Web Crypto API for cryptographic applications requiring longer digests.",
    category: "crypto",
    subgroup: "Hash Generators",
    tier: ToolTier.CLIENT,
    keywords: ["sha384", "sha-384", "hash", "digest", "crypto", "sha2"],
    icon: "Hash",
    examples: [
      {
        title: "Hash Text",
        description: "Generate the SHA-384 digest of a string",
        input: "hello",
        output:
          "59e1748777448c69de6b800d7a33bbfb9ff1b463e44354c3553bcdb9c666fa90125a3c79f90397bdf5f6a13de828684f",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: async (input) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(input.input);
    const hashBuffer = await crypto.subtle.digest("SHA-384", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return { output: hashHex };
  },
});
