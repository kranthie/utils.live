import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { EXEC_FAILED } from "../../core/error-codes";

const inputSchema = z.object({
  /** Text string to encode to Base64 */
  input: z.string().describe("Text string to encode to Base64"),
});

const outputSchema = z.object({
  /** Base64 encoded string */
  output: z.string().describe("Base64 encoded string"),
});

const optionsSchema = z.object({
  /** Use URL-safe Base64 encoding */
  urlSafe: z
    .boolean()
    .default(false)
    .describe("Use URL-safe Base64 encoding (replace +/ with -_)"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Converts bytes to base64 string.
 * Exported for testing purposes.
 */
export function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Encodes a string to Base64.
 * Works in both browser and Node.js environments.
 */
function execute(input: Input, options?: Options): Output {
  const urlSafe = options?.urlSafe ?? false;

  try {
    // Use TextEncoder for proper UTF-8 handling
    const encoder = new TextEncoder();
    const bytes = encoder.encode(input.input);

    // Convert to base64
    const base64 = bytesToBase64(bytes);

    // Apply URL-safe encoding if requested
    if (urlSafe) {
      return {
        output: base64
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, ""),
      };
    }

    return { output: base64 };
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to encode to Base64";
    throw createToolError({
      code: EXEC_FAILED,
      message: `Base64 encoding failed: ${errorMessage}`,
    });
  }
}

/**
 * Base64 Encode tool.
 * Encodes text to Base64 format with optional URL-safe encoding.
 */
export const base64Encode = defineTool({
  meta: {
    id: "encoding/base64-encode",
    name: "Base64 Encode",
    description:
      "Free online Base64 encoder — convert text to Base64 format instantly in your browser. No data is stored. Supports UTF-8 text, optional URL-safe encoding, and handles multi-byte characters.",
    category: "encoding",
    subgroup: "Base64",
    tier: ToolTier.CLIENT,
    keywords: ["base64", "encode", "encoding", "binary", "text"],
    examples: [
      {
        title: "Simple Text",
        description: "Encode a greeting to Base64",
        input: "Hello, World!",
        output: "SGVsbG8sIFdvcmxkIQ==",
      },
      {
        title: "JSON Payload",
        description: "Encode a JSON string for transport in a URL or header",
        input: '{"user":"admin","role":"editor"}',
        output: "eyJ1c2VyIjoiYWRtaW4iLCJyb2xlIjoiZWRpdG9yIn0=",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
