import { z } from "zod";
import TurndownService from "turndown";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("HTML content to convert"),
});

const outputSchema = z.object({
  markdown: z.string().describe("Converted Markdown"),
});

const optionsSchema = z.object({
  headingStyle: z
    .enum(["setext", "atx"])
    .default("atx")
    .describe("Heading style: setext (underlined) or atx (# prefixed)"),
  bulletListMarker: z
    .enum(["-", "+", "*"])
    .default("-")
    .describe("Character for bullet list items"),
  codeBlockStyle: z
    .enum(["indented", "fenced"])
    .default("fenced")
    .describe("Code block style: indented or fenced (```)"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Converts HTML to Markdown.
 */
function execute(input: Input, options?: Options): Output {
  const headingStyle = options?.headingStyle ?? "atx";
  const bulletListMarker = options?.bulletListMarker ?? "-";
  const codeBlockStyle = options?.codeBlockStyle ?? "fenced";

  // Create turndown service with options
  const turndownService = new TurndownService({
    headingStyle,
    bulletListMarker,
    codeBlockStyle,
  });

  // Convert HTML to Markdown
  const markdown = turndownService.turndown(input.input);

  return { markdown };
}

/**
 * HTML to Markdown tool.
 * Converts HTML content to Markdown using the turndown library.
 */
export const htmlToMarkdown = defineTool({
  meta: {
    id: "markdown/from-html",
    name: "HTML to Markdown",
    description:
      "Free online HTML to Markdown converter — transform HTML tags, lists, links, and code blocks to Markdown instantly in your browser. No data is stored. Supports ATX/setext heading styles, configurable bullet markers, and fenced/indented code blocks.",
    category: "markdown",
    subgroup: "Core",
    tier: ToolTier.CLIENT,
    keywords: ["html", "markdown", "convert", "turndown"],
    examples: [
      {
        title: "Convert HTML to Markdown",
        description: "Transform HTML tags into Markdown formatting",
        input:
          "<h1>Hello</h1>\n<p>This is <strong>bold</strong> and <em>italic</em>.</p>\n<ul><li>Item 1</li><li>Item 2</li></ul>",
        output:
          '{\n  "markdown": "# Hello\\n\\nThis is **bold** and _italic_.\\n\\n-   Item 1\\n-   Item 2"\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
