import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  type: z
    .enum(["any", "http", "https", "ftp", "with-path", "with-query"])
    .default("any")
    .describe("Type of URL pattern"),
});

const outputSchema = z.object({
  output: z.string().describe("URL regex pattern and description"),
  pattern: z.string().describe("The regex pattern"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

const PATTERNS: Record<string, { pattern: string; desc: string }> = {
  any: {
    pattern: "^(?:https?|ftp):\\/\\/[^\\s/$.?#].[^\\s]*$",
    desc: "Matches HTTP, HTTPS, and FTP URLs",
  },
  http: {
    pattern: "^http:\\/\\/[^\\s/$.?#].[^\\s]*$",
    desc: "Matches HTTP URLs only",
  },
  https: {
    pattern: "^https:\\/\\/[^\\s/$.?#].[^\\s]*$",
    desc: "Matches HTTPS URLs only",
  },
  ftp: {
    pattern: "^ftp:\\/\\/[^\\s/$.?#].[^\\s]*$",
    desc: "Matches FTP URLs only",
  },
  "with-path": {
    pattern:
      "^https?:\\/\\/[\\w.-]+(?:\\.[a-zA-Z]{2,})+(?:\\/[\\w.~:/?#[\\]@!$&'()*+,;=-]*)?$",
    desc: "HTTP/HTTPS URLs with optional path",
  },
  "with-query": {
    pattern:
      "^https?:\\/\\/[\\w.-]+(?:\\.[a-zA-Z]{2,})+(?:\\/[^?#]*)?(?:\\?[^#]*)?(?:#.*)?$",
    desc: "HTTP/HTTPS URLs with optional path, query, and fragment",
  },
};

function execute(input: Input): Output {
  const p = PATTERNS[input.type]!;
  return {
    output: `URL Regex (${input.type}):\n\n${p.pattern}\n\n${p.desc}`,
    pattern: p.pattern,
  };
}

export const urlRegex = defineTool({
  meta: {
    id: "regex/url-regex",
    name: "URL Regex",
    description:
      "Free online URL regex generator — create URL matching patterns for HTTP, HTTPS, FTP, and custom protocols instantly in your browser. No data is stored. Supports path, query string, and fragment matching.",
    category: "regex",
    subgroup: "Pattern Library",
    tier: ToolTier.CLIENT,
    keywords: [
      "regex",
      "url",
      "http",
      "https",
      "validate",
      "pattern",
      "link",
      "href",
      "match",
      "protocol",
    ],
    examples: [
      {
        title: "HTTPS URL validation pattern",
        description: "Get the regex pattern for validating HTTPS URLs only",
        input: "https",
        output:
          "URL Regex (https):\n\n^https:\\/\\/[^\\s/$.?#].[^\\s]*$\n\nMatches HTTPS URLs only",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
