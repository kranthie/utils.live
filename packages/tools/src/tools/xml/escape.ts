import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to escape for XML"),
});

const optionsSchema = z.object({
  escapeQuotes: z
    .boolean()
    .default(true)
    .describe("Escape single and double quotes"),
  escapeNewlines: z
    .boolean()
    .default(false)
    .describe("Escape newlines as &#10;"),
});

const outputSchema = z.object({
  output: z.string().describe("XML-escaped text"),
});

type Input = z.infer<typeof inputSchema>;
type Options = z.infer<typeof optionsSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Escapes text for use in XML.
 */
function execute(input: Input, options?: Options): Output {
  const escapeQuotes = options?.escapeQuotes ?? true;
  const escapeNewlines = options?.escapeNewlines ?? false;

  let output = input.input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  if (escapeQuotes) {
    output = output.replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  }

  if (escapeNewlines) {
    output = output.replace(/\n/g, "&#10;").replace(/\r/g, "&#13;");
  }

  return { output };
}

/**
 * XML Escape tool.
 * Escapes special characters for safe use in XML.
 */
export const xmlEscape = defineTool({
  meta: {
    id: "xml/escape",
    name: "XML Escape",
    description:
      "Free online XML escape tool — convert special characters to XML entities instantly in your browser. No data is stored. Escapes ampersands, angle brackets, quotes, and newlines for safe use in XML content and attributes.",
    category: "xml",
    tier: ToolTier.CLIENT,
    keywords: [
      "xml",
      "escape",
      "encode",
      "entities",
      "ampersand",
      "special-characters",
      "sanitize",
      "attribute",
    ],
    examples: [
      {
        title: "Escape HTML tags and special characters",
        description:
          "Escape angle brackets, ampersands, and quotes for safe embedding in XML documents",
        input: '<script>alert("XSS & injection")</script>',
        output:
          "&lt;script&gt;alert(&quot;XSS &amp; injection&quot;)&lt;/script&gt;",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
