import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  length: z
    .number()
    .min(16)
    .max(512)
    .default(64)
    .describe("Token length in characters"),
  count: z
    .number()
    .min(1)
    .max(100)
    .default(1)
    .describe("Number of tokens to generate"),
  format: z
    .enum(["hex", "base64", "urlsafe", "alphanumeric"])
    .default("hex")
    .describe("Token format"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated session token(s)"),
  entropy: z.number().describe("Entropy in bits"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function generateToken(
  length: number,
  format: string
): { token: string; entropy: number } {
  switch (format) {
    case "hex": {
      const byteLen = Math.ceil(length / 2);
      const bytes = new Uint8Array(byteLen);
      crypto.getRandomValues(bytes);
      const hex = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
        .substring(0, length);
      return { token: hex, entropy: byteLen * 8 };
    }
    case "base64": {
      const byteLen = Math.ceil((length * 3) / 4);
      const bytes = new Uint8Array(byteLen);
      crypto.getRandomValues(bytes);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]!);
      }
      return { token: btoa(binary).substring(0, length), entropy: byteLen * 8 };
    }
    case "urlsafe": {
      const byteLen = Math.ceil((length * 3) / 4);
      const bytes = new Uint8Array(byteLen);
      crypto.getRandomValues(bytes);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]!);
      }
      const b64 = btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
      return { token: b64.substring(0, length), entropy: byteLen * 8 };
    }
    case "alphanumeric": {
      const charset =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      const bytes = new Uint8Array(length);
      crypto.getRandomValues(bytes);
      const token = Array.from(bytes)
        .map((b) => charset[b % charset.length])
        .join("");
      return { token, entropy: Math.floor(length * Math.log2(charset.length)) };
    }
    default:
      throw new Error(`Unknown format: ${format}`);
  }
}

function execute(input: Input): Output {
  const tokens: string[] = [];
  let entropy = 0;
  for (let i = 0; i < input.count; i++) {
    const result = generateToken(input.length, input.format);
    tokens.push(result.token);
    entropy = result.entropy;
  }
  return { output: tokens.join("\n"), entropy };
}

export const sessionTokenGenerator = defineTool({
  meta: {
    id: "identifiers/session-token-generator",
    name: "Session Token Generator",
    description:
      "Free online session token generator — create cryptographically secure tokens instantly in your browser. No data is stored. Supports hex, base64, URL-safe, and alphanumeric formats with configurable length (16–512 chars) and entropy reporting.",
    category: "identifiers",
    tier: ToolTier.CLIENT,
    keywords: [
      "session",
      "token",
      "generate",
      "secure",
      "random",
      "secret",
      "api-key",
      "auth",
    ],
    examples: [
      {
        title: "Hex Session Token",
        description: "Generate a 64-character hex session token",
        input: { length: 64, count: 1, format: "hex" },
        output:
          "a3f1b2c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2",
      },
      {
        title: "URL-Safe Token",
        description: "Generate a 32-character URL-safe base64 token",
        input: { length: 32, count: 1, format: "urlsafe" },
        output: "o_5P2sTGg8HzR1kM9eYwXv3bNjCqA7dL",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
