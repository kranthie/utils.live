import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Message to authenticate"),
  key: z.string().describe("Secret key for HMAC"),
});

const outputSchema = z.object({
  output: z.string().describe("HMAC-SHA256 hex string"),
});

const optionsSchema = z.object({
  outputFormat: z
    .enum(["hex", "base64"])
    .default("hex")
    .describe("Output format"),
});

export const hmacSha256 = defineTool({
  meta: {
    id: "crypto/hmac-sha256",
    name: "HMAC-SHA256",
    description:
      "Free online HMAC-SHA256 generator — compute HMAC-SHA256 message authentication codes instantly in your browser. No data is stored. Supports hex and Base64 output formats using the Web Crypto API.",
    category: "crypto",
    subgroup: "HMAC & KDF",
    tier: ToolTier.CLIENT,
    keywords: [
      "hmac",
      "sha256",
      "mac",
      "authentication",
      "signature",
      "crypto",
    ],
    icon: "ShieldCheck",
    examples: [
      {
        title: "Authenticate Message",
        description:
          "Generate an HMAC-SHA256 signature for a message with a secret key",
        input: { input: "Hello, World!", key: "MySecretKey123!" },
        output:
          "4b9c49778c4b546b324ffad7e893237c62724d27c7e1cd2548d04a19d66254ae",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute: async (input, options) => {
    const format = options?.outputFormat ?? "hex";
    const encoder = new TextEncoder();

    const keyData = encoder.encode(input.key);
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      encoder.encode(input.input)
    );
    const bytes = new Uint8Array(signature);

    if (format === "base64") {
      let binary = "";
      for (const byte of bytes) {
        binary += String.fromCharCode(byte);
      }
      return { output: btoa(binary) };
    }

    return {
      output: Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""),
    };
  },
});
