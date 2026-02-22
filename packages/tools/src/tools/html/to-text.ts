import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("HTML string to convert to text"),
});

const outputSchema = z.object({
  output: z.string().describe("Plain text extracted from HTML"),
});

const optionsSchema = z.object({
  preserveLinks: z
    .boolean()
    .default(false)
    .describe("Preserve link URLs in [text](url) format"),
  preserveLineBreaks: z
    .boolean()
    .default(true)
    .describe("Convert <br> and block tags to line breaks"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

function execute(input: Input, options?: Options): Output {
  const raw = input.input;
  if (!raw.trim()) {
    throw new Error("Input cannot be empty");
  }

  const preserveLinks = options?.preserveLinks ?? false;
  const preserveLineBreaks = options?.preserveLineBreaks ?? true;

  let result = raw;

  // Remove script and style content
  result = result.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  result = result.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");

  // Remove HTML comments
  result = result.replace(/<!--[\s\S]*?-->/g, "");

  // Handle links
  if (preserveLinks) {
    result = result.replace(
      /<a\b[^>]*href\s*=\s*["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi,
      (_match, href, text) => `[${text}](${href})`
    );
  }

  // Convert <br> to newlines
  if (preserveLineBreaks) {
    result = result.replace(/<br\s*\/?>/gi, "\n");
    // Add newlines before and after block elements
    result = result.replace(
      /<\/?(?:div|p|h[1-6]|ul|ol|li|tr|table|blockquote|pre|hr|section|article|header|footer|nav|aside|main|form|fieldset|details|figure|figcaption|dd|dl|dt)\b[^>]*>/gi,
      "\n"
    );
  }

  // Decode common HTML entities
  result = result.replace(/&amp;/g, "&");
  result = result.replace(/&lt;/g, "<");
  result = result.replace(/&gt;/g, ">");
  result = result.replace(/&quot;/g, '"');
  result = result.replace(/&#39;/g, "'");
  result = result.replace(/&apos;/g, "'");
  result = result.replace(/&nbsp;/g, " ");
  result = result.replace(/&#(\d+);/g, (_m: string, code: string) =>
    String.fromCharCode(parseInt(code, 10))
  );
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_m: string, code: string) =>
    String.fromCharCode(parseInt(code, 16))
  );

  // Strip remaining tags
  result = result.replace(/<[^>]+>/g, "");

  // Clean up whitespace
  result = result.replace(/[ \t]+/g, " ");
  result = result.replace(/\n[ \t]+/g, "\n");
  result = result.replace(/[ \t]+\n/g, "\n");
  result = result.replace(/\n{3,}/g, "\n\n");
  result = result.trim();

  return { output: result };
}

export const htmlToText = defineTool({
  meta: {
    id: "html/to-text",
    name: "HTML to Text",
    description:
      "Free online HTML to plain text converter — strip tags and extract readable text from HTML instantly in your browser. No data is stored. Removes scripts, styles, and comments, decodes entities, and optionally preserves link URLs.",
    category: "html",
    tier: ToolTier.CLIENT,
    keywords: [
      "html",
      "text",
      "strip",
      "extract",
      "plain text",
      "convert",
      "remove tags",
      "readable",
    ],
    examples: [
      {
        title: "Extract readable text from a webpage snippet",
        description:
          "Strip all HTML tags and extract clean plain text from markup",
        input:
          '<h1>Welcome</h1><p>Visit our <a href="https://example.com">website</a> for more info.</p>',
        output: "Welcome\n\nVisit our website for more info.",
      },
    ],
    ui: {
      inputLanguage: "html",
    },
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
