import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to format as MS Teams Adaptive Card"),
});

const optionsSchema = z.object({
  format: z
    .enum(["adaptive-card", "markdown"])
    .default("markdown")
    .describe("Output format"),
});

const outputSchema = z.object({
  output: z.string().describe("Teams formatted content"),
});

type Input = z.infer<typeof inputSchema>;
type Options = z.infer<typeof optionsSchema>;
type Output = z.infer<typeof outputSchema>;

function toTeamsMarkdown(text: string): string {
  let result = text;

  // Teams uses a subset of markdown
  // Convert HTML to Teams markdown
  result = result.replace(/<b>([^<]*)<\/b>/gi, "**$1**");
  result = result.replace(/<strong>([^<]*)<\/strong>/gi, "**$1**");
  result = result.replace(/<i>([^<]*)<\/i>/gi, "_$1_");
  result = result.replace(/<em>([^<]*)<\/em>/gi, "_$1_");
  result = result.replace(/<s>([^<]*)<\/s>/gi, "~~$1~~");
  result = result.replace(/<del>([^<]*)<\/del>/gi, "~~$1~~");
  result = result.replace(/<a href="([^"]*)"[^>]*>([^<]*)<\/a>/gi, "[$2]($1)");
  result = result.replace(/<br\s*\/?>/gi, "\n");

  return result;
}

function toAdaptiveCard(text: string): string {
  const blocks: Array<Record<string, unknown>> = [];

  const lines = text.split("\n");
  let currentText = "";

  for (const line of lines) {
    if (line.startsWith("# ")) {
      if (currentText) {
        blocks.push({
          type: "TextBlock",
          text: currentText.trim(),
          wrap: true,
        });
        currentText = "";
      }
      blocks.push({
        type: "TextBlock",
        text: line.substring(2),
        weight: "Bolder",
        size: "ExtraLarge",
        wrap: true,
      });
    } else if (line.startsWith("## ")) {
      if (currentText) {
        blocks.push({
          type: "TextBlock",
          text: currentText.trim(),
          wrap: true,
        });
        currentText = "";
      }
      blocks.push({
        type: "TextBlock",
        text: line.substring(3),
        weight: "Bolder",
        size: "Large",
        wrap: true,
      });
    } else if (line.startsWith("### ")) {
      if (currentText) {
        blocks.push({
          type: "TextBlock",
          text: currentText.trim(),
          wrap: true,
        });
        currentText = "";
      }
      blocks.push({
        type: "TextBlock",
        text: line.substring(4),
        weight: "Bolder",
        size: "Medium",
        wrap: true,
      });
    } else if (line.startsWith("---")) {
      if (currentText) {
        blocks.push({
          type: "TextBlock",
          text: currentText.trim(),
          wrap: true,
        });
        currentText = "";
      }
      blocks.push({ type: "TextBlock", text: "---", separator: true });
    } else if (line.trim() === "") {
      if (currentText) {
        blocks.push({
          type: "TextBlock",
          text: currentText.trim(),
          wrap: true,
        });
        currentText = "";
      }
    } else {
      currentText += (currentText ? "\n" : "") + line;
    }
  }

  if (currentText) {
    blocks.push({ type: "TextBlock", text: currentText.trim(), wrap: true });
  }

  const card = {
    type: "AdaptiveCard",
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    version: "1.5",
    body: blocks,
  };

  return JSON.stringify(card, null, 2);
}

function execute(input: Input, options?: Options): Output {
  if (!input.input.trim()) {
    throw new Error("Input cannot be empty");
  }

  const format = options?.format ?? "markdown";

  if (format === "adaptive-card") {
    return { output: toAdaptiveCard(input.input) };
  } else {
    return { output: toTeamsMarkdown(input.input) };
  }
}

export const teamsFormatter = defineTool({
  meta: {
    id: "communication/teams-formatter",
    name: "Teams Formatter",
    description:
      "Free online Teams formatter — convert HTML or plain text to Microsoft Teams Markdown or Adaptive Card JSON instantly in your browser. No data is stored. Converts bold, italic, strikethrough, links, and line breaks to Teams-compatible formats.",
    category: "communication",
    subgroup: "Messaging",
    tier: ToolTier.CLIENT,
    keywords: [
      "teams",
      "microsoft",
      "format",
      "adaptive",
      "card",
      "message",
      "webhook",
      "connector",
    ],
    examples: [
      {
        title: "HTML to Teams Markdown",
        description:
          "Convert HTML formatted text with bold, italic, links, and strikethrough to Teams Markdown",
        input:
          'Hi team,<br>The <b>v2.0 release</b> is ready. See the <a href="https://example.com/docs">release notes</a> for details.<br>Key changes: <i>dark mode</i>, <s>legacy API</s> removed.',
        output:
          "Hi team,\nThe **v2.0 release** is ready. See the [release notes](https://example.com/docs) for details.\nKey changes: _dark mode_, ~~legacy API~~ removed.",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
