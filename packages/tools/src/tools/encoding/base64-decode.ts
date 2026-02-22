import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { BASE64_DECODE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  /** Base64 encoded string to decode */
  input: z.string().describe("Base64 encoded string to decode"),
});

const outputSchema = z.object({
  /** Decoded text string */
  output: z.string().describe("Decoded text string"),
});

const optionsSchema = z.object({
  /** Input uses URL-safe Base64 encoding */
  urlSafe: z
    .boolean()
    .default(false)
    .describe("Input uses URL-safe Base64 encoding (-_ instead of +/)"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Decodes base64 string to bytes.
 * Exported for testing purposes.
 */
export function base64ToBytes(base64: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(base64, "base64"));
  }
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decodes a Base64 string to text.
 * Works in both browser and Node.js environments.
 */
function execute(input: Input, options?: Options): Output {
  const urlSafe = options?.urlSafe ?? false;

  try {
    let base64 = input.input;

    // Convert from URL-safe if needed
    if (urlSafe) {
      base64 = base64.replace(/-/g, "+").replace(/_/g, "/");
      // Add padding if needed
      while (base64.length % 4) {
        base64 += "=";
      }
    }

    // Validate base64 format
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) {
      throw new Error("Invalid Base64 string");
    }

    // Decode from base64
    const bytes = base64ToBytes(base64);

    // Decode UTF-8
    const decoder = new TextDecoder();
    const output = decoder.decode(bytes);

    return { output };
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Invalid Base64 format";
    throw createToolError({
      code: BASE64_DECODE_ERROR,
      message: `Base64 decoding failed: ${errorMessage}`,
    });
  }
}

/**
 * Base64 Decode tool.
 * Decodes Base64 encoded strings back to text.
 */
export const base64Decode = defineTool({
  meta: {
    id: "encoding/base64-decode",
    name: "Base64 Decode",
    description:
      "Free online Base64 decoder — convert Base64 encoded strings back to plain text instantly in your browser. No data is stored. Supports standard and URL-safe Base64, handles padding, and decodes UTF-8 multi-byte characters.",
    category: "encoding",
    subgroup: "Base64",
    tier: ToolTier.CLIENT,
    keywords: ["base64", "decode", "decoding", "binary", "text"],
    examples: [
      {
        title: "Simple Text",
        description: "Decode a Base64 string back to plain text",
        input: "SGVsbG8sIFdvcmxkIQ==",
        output: "Hello, World!",
      },
      {
        title: "JSON Payload",
        description: "Decode a Base64-encoded JSON payload",
        input: "eyJ1c2VyIjoiYWRtaW4iLCJyb2xlIjoiZWRpdG9yIn0=",
        output: '{"user":"admin","role":"editor"}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
