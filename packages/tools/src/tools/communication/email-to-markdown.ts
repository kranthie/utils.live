import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Email text content"),
});

const outputSchema = z.object({
  output: z.string().describe("Markdown formatted email"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  if (!input.input.trim()) {
    throw new Error("Input cannot be empty");
  }

  const text = input.input;
  const lines: string[] = [];
  const emailLines = text.split(/\r?\n/);

  let inHeaders = true;
  const headers: Record<string, string> = {};

  for (const line of emailLines) {
    if (inHeaders) {
      if (line.trim() === "") {
        inHeaders = false;
        // Output headers as metadata
        if (Object.keys(headers).length > 0) {
          if (headers["Subject"]) lines.push(`# ${headers["Subject"]}\n`);
          lines.push("| Field | Value |");
          lines.push("|-------|-------|");
          for (const [key, val] of Object.entries(headers)) {
            if (key !== "Subject") {
              lines.push(`| **${key}** | ${val} |`);
            }
          }
          lines.push("");
          lines.push("---\n");
        }
        continue;
      }

      const colonIdx = line.indexOf(":");
      if (colonIdx > 0 && !/^\s/.test(line)) {
        const key = line.substring(0, colonIdx).trim();
        const val = line.substring(colonIdx + 1).trim();
        headers[key] = val;
        continue;
      }
    }

    // Convert email body to markdown
    let mdLine = line;

    // Convert quoted text to blockquotes
    if (mdLine.startsWith(">")) {
      // Already blockquote format
    } else if (mdLine.startsWith("    ")) {
      mdLine = `> ${mdLine.trim()}`;
    }

    // Convert URLs to markdown links
    mdLine = mdLine.replace(
      /(?<!\[)(https?:\/\/[^\s<>]+)/g,
      (url) => `[${url}](${url})`
    );

    // Convert email addresses to mailto links, preserving (email) in parentheses
    mdLine = mdLine.replace(
      /\(([\w.+-]+@[\w-]+\.[\w.-]+)\)|([\w.+-]+@[\w-]+\.[\w.-]+)/g,
      (match, inParens: string | undefined, standalone: string | undefined) => {
        if (inParens !== undefined) return match; // keep (email) unchanged
        return `[${standalone!}](mailto:${standalone!})`;
      }
    );

    lines.push(mdLine);
  }

  // If no headers were found, just return cleaned text
  if (Object.keys(headers).length === 0) {
    return { output: input.input };
  }

  return { output: lines.join("\n") };
}

export const emailToMarkdown = defineTool({
  meta: {
    id: "communication/email-to-markdown",
    name: "Email to Markdown",
    description:
      "Free online email to Markdown converter — paste a plain-text email and get Markdown instantly in your browser. No data is stored. Converts headers to a metadata table, URLs to clickable links, email addresses to mailto links, and indented text to blockquotes.",
    category: "communication",
    subgroup: "Email",
    tier: ToolTier.CLIENT,
    keywords: [
      "email",
      "markdown",
      "convert",
      "text",
      "format",
      "headers",
      "mailto",
      "blockquote",
    ],
    examples: [
      {
        title: "Email with links and addresses",
        description:
          "Convert an email with headers, a URL, and an email address to Markdown",
        input:
          "From: alice@example.com\nTo: bob@example.com\nSubject: Q1 Sprint Planning\nDate: Mon, 13 Jan 2025 10:00:00 -0500\n\nHi Bob,\n\nThe sprint backlog is ready at https://example.com/board/q1\n\nPlease review and reach out to me or carol@example.com with questions.\n\nBest,\nAlice",
        output:
          "# Q1 Sprint Planning\n\n| Field | Value |\n|-------|-------|\n| **From** | alice@example.com |\n| **To** | bob@example.com |\n| **Date** | Mon, 13 Jan 2025 10:00:00 -0500 |\n\n---\n\nHi Bob,\n\nThe sprint backlog is ready at [https://example.com/board/q1](https://example.com/board/q1)\n\nPlease review and reach out to me or [carol@example.com](mailto:carol@example.com) with questions.\n\nBest,\nAlice",
      },
    ],
    ui: { outputLanguage: "markdown" },
  },
  inputSchema,
  outputSchema,
  execute,
});
