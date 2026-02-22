import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { EXEC_FAILED } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("URL-safe Base64 encoded string to decode"),
});

const outputSchema = z.object({
  output: z.string().describe("Decoded text string"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  try {
    // Convert from URL-safe back to standard base64
    let base64 = input.input.replace(/-/g, "+").replace(/_/g, "/");
    // Add padding
    while (base64.length % 4) {
      base64 += "=";
    }

    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) {
      throw new Error("Invalid Base64URL string");
    }

    let bytes: Uint8Array;
    if (typeof Buffer !== "undefined") {
      bytes = new Uint8Array(Buffer.from(base64, "base64"));
    } else {
      const binaryString = atob(base64);
      bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
    }

    const decoder = new TextDecoder();
    return { output: decoder.decode(bytes) };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Invalid Base64URL format";
    throw createToolError({
      code: EXEC_FAILED,
      message: `Base64URL decoding failed: ${msg}`,
    });
  }
}

export const base64urlDecode = defineTool({
  meta: {
    id: "encoding/base64url-decode",
    name: "Base64URL Decode",
    description:
      "Free online Base64URL decoder — decode URL-safe Base64 encoded strings back to text instantly in your browser. No data is stored. Handles RFC 4648 format with -_ characters and missing padding.",
    category: "encoding",
    subgroup: "Base Encoding",
    tier: ToolTier.CLIENT,
    keywords: ["base64url", "base64", "url-safe", "decode", "rfc4648"],
    examples: [
      {
        title: "Decode Base64URL",
        description: "Decode a URL-safe Base64 string back to text",
        input: "SGVsbG8sIFdvcmxkIQ",
        output: "Hello, World!",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
