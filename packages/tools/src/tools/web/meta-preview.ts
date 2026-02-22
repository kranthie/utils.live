import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z
    .string()
    .describe("HTML head content or full HTML page to extract meta from"),
});

const outputSchema = z.object({
  output: z.string().describe("HTML preview of search engine result"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function extractMeta(html: string, name: string): string {
  const regex = new RegExp(
    `<meta\\s+(?:name|property)\\s*=\\s*["']${name}["'][^>]*content\\s*=\\s*["']([^"']*)["']|<meta\\s+content\\s*=\\s*["']([^"']*)["'][^>]*(?:name|property)\\s*=\\s*["']${name}["']`,
    "i"
  );
  const match = html.match(regex);
  return match?.[1] || match?.[2] || "";
}

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match?.[1] || "";
}

function execute(input: Input): Output {
  const raw = input.input;
  if (!raw.trim()) {
    throw new Error("Input cannot be empty");
  }

  const title =
    extractMeta(raw, "og:title") || extractTitle(raw) || "Page Title";
  const description =
    extractMeta(raw, "description") ||
    extractMeta(raw, "og:description") ||
    "No description available.";
  const url = extractMeta(raw, "og:url") || "https://example.com";

  // Build Google-like preview
  const displayUrl = url.replace(/^https?:\/\//, "").replace(/\/$/, "");

  const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; padding: 16px;">
  <div style="margin-bottom: 24px;">
    <h3 style="margin: 0 0 4px 0; font-size: 14px; color: #666;">Search Engine Preview</h3>
    <div style="border: 1px solid #dfe1e5; border-radius: 8px; padding: 16px; background: white;">
      <div style="font-size: 14px; color: #202124; margin-bottom: 4px;">${displayUrl}</div>
      <div style="font-size: 20px; color: #1a0dab; margin-bottom: 4px; cursor: pointer; line-height: 1.3;">${title}</div>
      <div style="font-size: 14px; color: #4d5156; line-height: 1.5;">${description.length > 160 ? description.substring(0, 160) + "..." : description}</div>
    </div>
  </div>
  <div>
    <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #666;">Meta Information</h3>
    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
      <tr><td style="padding: 4px 8px; color: #666; width: 120px;">Title</td><td style="padding: 4px 8px;">${title} <span style="color: ${title.length <= 60 ? "green" : "red"};">(${title.length}/60)</span></td></tr>
      <tr><td style="padding: 4px 8px; color: #666;">Description</td><td style="padding: 4px 8px;">${description.substring(0, 80)}... <span style="color: ${description.length <= 160 ? "green" : "red"};">(${description.length}/160)</span></td></tr>
      <tr><td style="padding: 4px 8px; color: #666;">URL</td><td style="padding: 4px 8px;">${url}</td></tr>
    </table>
  </div>
</div>`.trim();

  return { output: html };
}

export const metaPreview = defineTool({
  meta: {
    id: "web/meta-preview",
    name: "Meta Preview",
    description:
      "Free online meta tag preview — see how your page appears in Google search results with title length and description analysis instantly in your browser. No data is stored. Shows SERP preview with character count indicators.",
    category: "web",
    subgroup: "SEO & Meta",
    tier: ToolTier.CLIENT,
    keywords: [
      "meta",
      "preview",
      "seo",
      "search",
      "google",
      "serp",
      "title",
      "description",
      "character-count",
      "snippet",
    ],
    ui: {
      inputLanguage: "html",
      outputRenderer: "html",
    },
    examples: [
      {
        title: "Preview blog post search engine listing",
        description:
          "See how a blog post with title and description meta tags appears in Google search results",
        input:
          '<title>My Blog Post</title>\n<meta name="description" content="Learn about web development best practices and modern frameworks.">',
        output:
          '<div style="font-family: Arial, sans-serif; max-width: 600px; padding: 16px;">\n  <div style="margin-bottom: 24px;">\n    <h3 style="margin: 0 0 4px 0; font-size: 14px; color: #666;">Search Engine Preview</h3>\n    <div style="border: 1px solid #dfe1e5; border-radius: 8px; padding: 16px; background: white;">\n      <div style="font-size: 14px; color: #202124; margin-bottom: 4px;">example.com</div>\n      <div style="font-size: 20px; color: #1a0dab; margin-bottom: 4px; cursor: pointer; line-height: 1.3;">My Blog Post</div>\n      <div style="font-size: 14px; color: #4d5156; line-height: 1.5;">Learn about web development best practices and modern frameworks.</div>\n    </div>\n  </div>\n  <div>\n    <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #666;">Meta Information</h3>\n    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">\n      <tr><td style="padding: 4px 8px; color: #666; width: 120px;">Title</td><td style="padding: 4px 8px;">My Blog Post <span style="color: green;">(12/60)</span></td></tr>\n      <tr><td style="padding: 4px 8px; color: #666;">Description</td><td style="padding: 4px 8px;">Learn about web development best practices and modern frameworks.... <span style="color: green;">(65/160)</span></td></tr>\n      <tr><td style="padding: 4px 8px; color: #666;">URL</td><td style="padding: 4px 8px;">https://example.com</td></tr>\n    </table>\n  </div>\n</div>',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
