import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("reStructuredText content to convert"),
});

const outputSchema = z.object({
  output: z.string().describe("Markdown content"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Converts reStructuredText to Markdown.
 */
function rstToMarkdown(rst: string): string {
  let result = rst;

  // Title underlines to headers
  // RST uses underlines for titles, with different characters for different levels
  const lines = result.split("\n");
  const converted: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? "";
    const nextLine = lines[i + 1] ?? "";

    // Check if next line is an underline (RST title syntax)
    if (/^[=\-~`'"^_*+#]+$/.test(nextLine) && nextLine.length >= line.length) {
      const underlineChar = nextLine[0] ?? "=";
      let level = 1;
      // Map common RST underline chars to heading levels
      if (underlineChar === "=") level = 1;
      else if (underlineChar === "-") level = 2;
      else if (underlineChar === "~") level = 3;
      else if (underlineChar === "^") level = 4;
      else if (underlineChar === '"') level = 5;
      else level = 6;

      converted.push("#".repeat(level) + " " + line);
      i += 2; // Skip the underline
      continue;
    }

    // Check if current line is an overline (RST title with overline)
    const thirdLine = lines[i + 2] ?? "";
    if (
      /^[=\-~`'"^_*+#]+$/.test(line) &&
      i + 2 < lines.length &&
      /^[=\-~`'"^_*+#]+$/.test(thirdLine)
    ) {
      const titleLine = lines[i + 1] ?? "";
      if (titleLine && line.length >= titleLine.length) {
        const underlineChar = line[0] ?? "=";
        let level = 1;
        if (underlineChar === "=") level = 1;
        else if (underlineChar === "-") level = 2;
        else level = 3;
        converted.push("#".repeat(level) + " " + titleLine);
        i += 3; // Skip overline, title, and underline
        continue;
      }
    }

    converted.push(line);
    i++;
  }

  result = converted.join("\n");

  // Inline formatting
  // Bold: **text** or :strong:`text`
  result = result.replace(/:strong:`([^`]+)`/g, "**$1**");

  // Italic: *text* or :emphasis:`text`
  result = result.replace(/:emphasis:`([^`]+)`/g, "*$1*");

  // Inline code: ``code`` -> `code`
  result = result.replace(/``([^`]+)``/g, "`$1`");

  // Interpreted text: :role:`text` -> various
  result = result.replace(/:code:`([^`]+)`/g, "`$1`");
  result = result.replace(/:file:`([^`]+)`/g, "`$1`");
  result = result.replace(/:command:`([^`]+)`/g, "`$1`");
  result = result.replace(/:ref:`([^`]+)`/g, "[$1]");
  result = result.replace(/:doc:`([^`]+)`/g, "[$1]");

  // Links: `text <url>`_ -> [text](url)
  result = result.replace(/`([^<]+)<([^>]+)>`_/g, "[$1]($2)");

  // Anonymous links: `text`__ -> text (simplified)
  result = result.replace(/`([^`]+)`__/g, "$1");

  // Simple links: URL_ -> <URL>
  result = result.replace(/(\S+)_(?=\s|$)/g, "<$1>");

  // Bullet lists: * item -> - item
  result = result.replace(/^(\s*)\* /gm, "$1- ");

  // Numbered lists: #. item -> 1. item (simplified)
  result = result.replace(/^(\s*)#\. /gm, "$11. ");

  // Code blocks: :: followed by indented code
  result = result.replace(
    /::\s*\n\n((?:[ ]{2,}.*\n?)+)/g,
    (_match: string, code: string) =>
      "```\n" + code.replace(/^[ ]{2}/gm, "") + "```\n"
  );

  // Standalone :: at end of line
  result = result.replace(/::$/gm, "");

  // Directives: .. directive:: content
  result = result.replace(
    /\.\. note::\s*\n((?:[ ]{3,}.*\n?)+)/g,
    (_match: string, content: string) => {
      const text = content.replace(/^[ ]{3}/gm, "").trim();
      return `> **Note:** ${text}\n`;
    }
  );

  result = result.replace(
    /\.\. warning::\s*\n((?:[ ]{3,}.*\n?)+)/g,
    (_match: string, content: string) => {
      const text = content.replace(/^[ ]{3}/gm, "").trim();
      return `> **Warning:** ${text}\n`;
    }
  );

  result = result.replace(
    /\.\. tip::\s*\n((?:[ ]{3,}.*\n?)+)/g,
    (_match: string, content: string) => {
      const text = content.replace(/^[ ]{3}/gm, "").trim();
      return `> **Tip:** ${text}\n`;
    }
  );

  // Image directive: .. image:: path -> ![](path)
  result = result.replace(/\.\. image:: (.+)/g, "![]($1)");

  // Figure directive (simplified)
  result = result.replace(/\.\. figure:: (.+)/g, "![]($1)");

  // Comments: .. comment -> removed
  result = result.replace(/^\.\. [^:]+(?:\n(?:[ ]{3,}.*)?)*$/gm, "");

  // Definition lists (simplified conversion)
  result = result.replace(
    /^(\S.+)\n([ ]{2,})(.+)$/gm,
    (_, term, __, definition) => `**${term}**: ${definition}`
  );

  // Field lists: :field: value
  result = result.replace(/^:([^:]+):\s*(.+)$/gm, "**$1:** $2");

  // Clean up extra blank lines
  result = result.replace(/\n{3,}/g, "\n\n");

  return result.trim();
}

/**
 * Converts reStructuredText to Markdown.
 */
function execute(input: Input): Output {
  const output = rstToMarkdown(input.input);
  return { output };
}

/**
 * reStructuredText to Markdown converter tool.
 * Converts RST format to Markdown.
 */
export const rstToMd = defineTool({
  meta: {
    id: "markdown/rst-to-md",
    name: "RST to Markdown",
    description:
      "Free online reStructuredText to Markdown converter — transform RST titles, inline formatting, code blocks, directives, links, and lists to Markdown instantly in your browser. No data is stored. Supports Sphinx roles, admonitions, images, and definition lists.",
    category: "markdown",
    subgroup: "Additional",
    tier: ToolTier.CLIENT,
    keywords: ["markdown", "rst", "restructuredtext", "sphinx", "convert"],
    examples: [
      {
        title: "Convert RST to Markdown",
        description: "Transform reStructuredText to Markdown",
        input:
          "Features\n========\n\nThis is **bold** and *italic*.\n\n.. code-block:: python\n\n   print('hello')",
        output:
          "# Features\n\nThis is **bold** and *italic*.\n\n.. code-block:: python\n\n   print('hello')",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
