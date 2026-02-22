import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { EXEC_FAILED } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("Content to embed in the data URL"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated data URL"),
});

const optionsSchema = z.object({
  mimeType: z
    .string()
    .default("text/plain")
    .describe(
      "MIME type (e.g., text/plain, text/html, application/json, image/svg+xml)"
    ),
  encoding: z
    .enum(["base64", "utf8"])
    .default("base64")
    .describe("Encoding method: base64 or utf8 (percent-encoded)"),
  charset: z
    .string()
    .default("utf-8")
    .describe("Character set (e.g., utf-8, us-ascii)"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

function execute(input: Input, options?: Options): Output {
  const mimeType = options?.mimeType ?? "text/plain";
  const encoding = options?.encoding ?? "base64";
  const charset = options?.charset ?? "utf-8";

  try {
    if (encoding === "base64") {
      const encoder = new TextEncoder();
      const bytes = encoder.encode(input.input);
      let base64: string;
      if (typeof Buffer !== "undefined") {
        base64 = Buffer.from(bytes).toString("base64");
      } else {
        base64 = btoa(String.fromCharCode(...bytes));
      }
      return {
        output: `data:${mimeType};charset=${charset};base64,${base64}`,
      };
    } else {
      // UTF-8 / percent encoding
      const encoded = encodeURIComponent(input.input);
      return {
        output: `data:${mimeType};charset=${charset},${encoded}`,
      };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to build data URL";
    throw createToolError({
      code: EXEC_FAILED,
      message: `Data URL building failed: ${msg}`,
    });
  }
}

export const dataUrlBuilder = defineTool({
  meta: {
    id: "encoding/data-url-builder",
    name: "Data URL Builder",
    description:
      "Free online data URL builder — create data URIs from text content instantly in your browser. No data is stored. Supports customizable MIME types, Base64 or UTF-8 encoding, and configurable character sets for embedding inline resources.",
    category: "encoding",
    subgroup: "URL Encoding",
    tier: ToolTier.CLIENT,
    keywords: ["data", "url", "base64", "embed", "inline", "builder"],
    examples: [
      {
        title: "Plain Text Data URL",
        description: "Create a data URL from a simple text string",
        input: "Hello, World!",
        output: "data:text/plain;charset=utf-8;base64,SGVsbG8sIFdvcmxkIQ==",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
