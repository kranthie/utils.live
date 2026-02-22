import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  url: z.string().default("https://example.com/page").describe("Canonical URL"),
  includeLink: z.boolean().default(true).describe("Include HTML link tag"),
  includeHeader: z
    .boolean()
    .default(false)
    .describe("Include HTTP header format"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated canonical URL tag"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const url = input.url.trim();
  if (!url) {
    throw new Error("URL cannot be empty");
  }

  const parts: string[] = [];

  if (input.includeLink) {
    parts.push(`<!-- Canonical URL -->`);
    parts.push(`<link rel="canonical" href="${url}">`);
  }

  if (input.includeHeader) {
    parts.push("");
    parts.push(`# HTTP Header`);
    parts.push(`Link: <${url}>; rel="canonical"`);
  }

  return { output: parts.join("\n") };
}

export const canonicalUrlBuilder = defineTool({
  meta: {
    id: "web/canonical-url-builder",
    name: "Canonical URL Builder",
    description:
      "Free online canonical URL builder — generate canonical link tags to prevent duplicate content issues instantly in your browser. No data is stored. Supports HTML link tags and HTTP header format.",
    category: "web",
    subgroup: "SEO & Meta",
    tier: ToolTier.CLIENT,
    keywords: [
      "canonical",
      "url",
      "seo",
      "link",
      "generator",
      "duplicate content",
      "rel-canonical",
      "html",
      "header",
    ],
    ui: {
      outputLanguage: "html",
    },
    examples: [
      {
        title: "Blog article canonical URL tag",
        description: "Generate a canonical link tag for a blog article URL",
        input: {
          url: "https://example.com/blog/my-article",
          includeLink: true,
          includeHeader: false,
        },
        output:
          '<!-- Canonical URL -->\n<link rel="canonical" href="https://example.com/blog/my-article">',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
