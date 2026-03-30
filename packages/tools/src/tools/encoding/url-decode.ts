import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { EXEC_FAILED } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("URL-encoded string to decode"),
});

const outputSchema = z.object({
  output: z.string().describe("Decoded text string"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  try {
    return { output: decodeURIComponent(input.input) };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Invalid URL encoding";
    throw createToolError({
      code: EXEC_FAILED,
      message: `URL decoding failed: ${msg}`,
    });
  }
}

export const urlDecode = defineTool({
  meta: {
    id: "encoding/url-decode",
    name: "URL Decode",
    description:
      "Free online URL decoder — decode percent-encoded (URL-encoded) strings back to readable text instantly in your browser. No data is stored. Handles %XX hex sequences, UTF-8 multi-byte characters, and nested encoding.",
    category: "encoding",
    subgroup: "URL Encoding",
    tier: ToolTier.CLIENT,
    keywords: [
      "url",
      "decode",
      "percent",
      "uri",
      "decodeURIComponent",
      "url decoder online",
      "percent decode url",
      "url decoding tool",
    ],
    examples: [
      {
        title: "Query Parameter",
        description: "Decode a percent-encoded URL query string",
        input: "hello%20world%20%26%20goodbye%3Dcruel%2Bworld",
        output: "hello world & goodbye=cruel+world",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
