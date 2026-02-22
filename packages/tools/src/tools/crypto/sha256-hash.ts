import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to hash with SHA-256"),
});

const outputSchema = z.object({
  output: z.string().describe("SHA-256 hash hex string"),
});

export const sha256Hash = defineTool({
  meta: {
    id: "crypto/sha256-hash",
    name: "SHA-256 Hash",
    description:
      "Free online SHA-256 hash generator — compute SHA-256 digests instantly in your browser. No data is stored. Produces a 64-character hex hash using the Web Crypto API for data integrity and cryptographic verification.",
    category: "crypto",
    subgroup: "Hash Generators",
    tier: ToolTier.CLIENT,
    keywords: ["sha256", "sha-256", "hash", "digest", "crypto", "sha2"],
    icon: "Hash",
    examples: [
      {
        title: "Hash Text",
        description: "Generate the SHA-256 digest of a simple string",
        input: "hello",
        output:
          "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
      },
      {
        title: "Hash Password",
        description:
          "SHA-256 hash of a password string (not recommended for password storage -- use bcrypt instead)",
        input: "my-secret-password",
        output:
          "a9c90c47c231afb31950169ccb89951337eb0689d31660e32c34835bb7018c0c",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: async (input) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(input.input);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return { output: hashHex };
  },
});
