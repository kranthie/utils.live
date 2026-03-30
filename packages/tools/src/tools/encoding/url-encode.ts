import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { EXEC_FAILED } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("Text to URL-encode (percent encoding)"),
});

const outputSchema = z.object({
  output: z.string().describe("URL-encoded string"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  try {
    return { output: encodeURIComponent(input.input) };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to encode";
    throw createToolError({
      code: EXEC_FAILED,
      message: `URL encoding failed: ${msg}`,
    });
  }
}

export const urlEncode = defineTool({
  meta: {
    id: "encoding/url-encode",
    name: "URL Encode",
    description:
      "Free online URL encoder — percent-encode text using standard encodeURIComponent encoding instantly in your browser. No data is stored. Encodes special characters, spaces, Unicode, and reserved URL characters while preserving safe ASCII.",
    category: "encoding",
    subgroup: "URL Encoding",
    tier: ToolTier.CLIENT,
    keywords: [
      "url",
      "encode",
      "percent",
      "uri",
      "encodeURIComponent",
      "url encoder online",
      "percent encode url",
      "url encoding tool",
    ],
    examples: [
      {
        title: "Query Parameter",
        description:
          "Encode a search query with special characters for use in a URL",
        input: "hello world & goodbye=cruel+world",
        output: "hello%20world%20%26%20goodbye%3Dcruel%2Bworld",
      },
      {
        title: "Unicode Text",
        description: "Percent-encode non-ASCII characters",
        input: "cafe\u0301 na\u00EFve",
        output: "cafe%CC%81%20na%C3%AFve",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
