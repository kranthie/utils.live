/**
 * Markdown to HTML converter.
 *
 * ARCHITECTURE NOTE: This tool uses `isomorphic-dompurify` which bundles JSDOM
 * in Node.js environments. This is an explicit exception to the "no DOM" rule
 * for the tools package. The dependency is required for safe HTML sanitization
 * and works in both browser and Node.js environments. The tool is CLIENT tier.
 */
import { z } from "zod";
import { Marked } from "marked";
import DOMPurify from "isomorphic-dompurify";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Markdown content to convert"),
});

const outputSchema = z.object({
  html: z.string().describe("Converted HTML"),
});

const optionsSchema = z.object({
  gfm: z.boolean().default(true).describe("Enable GitHub Flavored Markdown"),
  breaks: z.boolean().default(false).describe("Convert line breaks to <br>"),
  sanitize: z
    .boolean()
    .default(true)
    .describe("Sanitize HTML output (strip dangerous tags)"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Converts Markdown to HTML.
 */
function execute(input: Input, options?: Options): Output {
  const gfm = options?.gfm ?? true;
  const breaks = options?.breaks ?? false;
  const sanitize = options?.sanitize ?? true;

  // Create a new Marked instance per execution to avoid global state mutation
  const marked = new Marked({ gfm, breaks });

  // Parse markdown to HTML
  let html = marked.parse(input.input, { async: false });

  // Sanitize by default using DOMPurify
  if (sanitize) {
    html = DOMPurify.sanitize(html);
  }

  return { html };
}

/**
 * Markdown to HTML tool.
 * Converts Markdown content to HTML using the marked library.
 */
export const markdownToHtml = defineTool({
  meta: {
    id: "markdown/to-html",
    name: "Markdown to HTML",
    description:
      "Free online Markdown to HTML converter — render Markdown to sanitized HTML with GitHub Flavored Markdown support instantly in your browser. No data is stored. Supports GFM tables, task lists, strikethrough, autolinks, and optional line break conversion.",
    category: "markdown",
    subgroup: "Core",
    tier: ToolTier.CLIENT,
    keywords: ["markdown", "html", "convert", "render", "gfm"],
    examples: [
      {
        title: "Convert Markdown to HTML",
        description: "Render Markdown content as HTML",
        input:
          "# Hello World\n\nThis is **bold** and *italic*.\n\n- Item 1\n- Item 2",
        output:
          "<h1>Hello World</h1>\n<p>This is <strong>bold</strong> and <em>italic</em>.</p>\n<ul><li>Item 1</li><li>Item 2</li></ul>",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
