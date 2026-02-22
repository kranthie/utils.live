import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { EXEC_FAILED } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("Text string to encode to URL-safe Base64"),
});

const outputSchema = z.object({
  output: z.string().describe("URL-safe Base64 encoded string"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  try {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(input.input);
    let base64: string;
    if (typeof Buffer !== "undefined") {
      base64 = Buffer.from(bytes).toString("base64");
    } else {
      base64 = btoa(String.fromCharCode(...bytes));
    }
    // Convert to URL-safe: replace +/ with -_, remove padding
    const urlSafe = base64
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    return { output: urlSafe };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to encode";
    throw createToolError({
      code: EXEC_FAILED,
      message: `Base64URL encoding failed: ${msg}`,
    });
  }
}

export const base64urlEncode = defineTool({
  meta: {
    id: "encoding/base64url-encode",
    name: "Base64URL Encode",
    description:
      "Free online Base64URL encoder — encode text to URL-safe Base64 format instantly in your browser. No data is stored. Produces RFC 4648 output with -_ instead of +/ and no padding, ideal for JWTs and URL parameters.",
    category: "encoding",
    subgroup: "Base Encoding",
    tier: ToolTier.CLIENT,
    keywords: ["base64url", "base64", "url-safe", "encode", "rfc4648"],
    examples: [
      {
        title: "Encode for URL",
        description:
          "Encode text to URL-safe Base64 (no padding, safe characters)",
        input: "Hello, World!",
        output: "SGVsbG8sIFdvcmxkIQ",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
