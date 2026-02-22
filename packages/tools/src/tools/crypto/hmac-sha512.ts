import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Message to authenticate"),
  key: z.string().describe("Secret key for HMAC"),
});

const outputSchema = z.object({
  output: z.string().describe("HMAC-SHA512 hex string"),
});

const optionsSchema = z.object({
  outputFormat: z
    .enum(["hex", "base64"])
    .default("hex")
    .describe("Output format"),
});

export const hmacSha512 = defineTool({
  meta: {
    id: "crypto/hmac-sha512",
    name: "HMAC-SHA512",
    description:
      "Free online HMAC-SHA512 generator — compute HMAC-SHA512 message authentication codes instantly in your browser. No data is stored. Supports hex and Base64 output formats using the Web Crypto API.",
    category: "crypto",
    subgroup: "HMAC & KDF",
    tier: ToolTier.CLIENT,
    keywords: [
      "hmac",
      "sha512",
      "mac",
      "authentication",
      "signature",
      "crypto",
    ],
    icon: "ShieldCheck",
    examples: [
      {
        title: "HMAC-SHA512 Signature",
        description:
          "Generate an HMAC-SHA512 authentication code for a message",
        input: { input: "Hello, World!", key: "MySecretKey123!" },
        output:
          "3eae1073dc45c5a21427c85daf48fd6e6d56ab14e15d72209119e5651566727b11cd30d68d3adb9c21f246c4e518065481e89889c4426d77c741e9ce890e601b",
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
      { name: "HMAC", hash: "SHA-512" },
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
