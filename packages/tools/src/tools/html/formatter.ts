import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("HTML string to format"),
});

const outputSchema = z.object({
  output: z.string().describe("Formatted HTML string"),
});

const optionsSchema = z.object({
  indent: z
    .number()
    .int()
    .min(1)
    .max(8)
    .default(2)
    .describe("Spaces per indent level"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

const VOID_ELEMENTS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

const RAW_TEXT_ELEMENTS = new Set([
  "script",
  "style",
  "pre",
  "code",
  "textarea",
]);

function execute(input: Input, options?: Options): Output {
  const raw = input.input;
  if (!raw.trim()) {
    throw new Error("Input cannot be empty");
  }

  const indentSize = options?.indent ?? 2;
  const indentStr = " ".repeat(indentSize);
  const lines: string[] = [];
  let level = 0;

  // Tokenize: split into tags and text
  const tokens: string[] = [];
  let pos = 0;
  while (pos < raw.length) {
    if (raw[pos] === "<") {
      // Check for comment
      if (raw.startsWith("<!--", pos)) {
        const end = raw.indexOf("-->", pos);
        if (end === -1) {
          tokens.push(raw.substring(pos));
          pos = raw.length;
        } else {
          tokens.push(raw.substring(pos, end + 3));
          pos = end + 3;
        }
      } else if (raw.startsWith("<!", pos)) {
        // Doctype
        const end = raw.indexOf(">", pos);
        if (end === -1) {
          tokens.push(raw.substring(pos));
          pos = raw.length;
        } else {
          tokens.push(raw.substring(pos, end + 1));
          pos = end + 1;
        }
      } else {
        const end = raw.indexOf(">", pos);
        if (end === -1) {
          tokens.push(raw.substring(pos));
          pos = raw.length;
        } else {
          tokens.push(raw.substring(pos, end + 1));
          pos = end + 1;
        }
      }
    } else {
      const next = raw.indexOf("<", pos);
      if (next === -1) {
        tokens.push(raw.substring(pos));
        pos = raw.length;
      } else {
        tokens.push(raw.substring(pos, next));
        pos = next;
      }
    }
  }

  let inRawElement = false;
  let rawTagName = "";

  for (const token of tokens) {
    const trimmed = token.trim();
    if (!trimmed) continue;

    // Check if we're exiting a raw text element
    if (inRawElement) {
      const closeMatch = trimmed.match(/^<\/(\w+)\s*>$/);
      if (
        closeMatch &&
        closeMatch[1] &&
        closeMatch[1].toLowerCase() === rawTagName
      ) {
        inRawElement = false;
        // Output the content as-is and the closing tag
        lines.push(
          indentStr.repeat(level + 1) +
            trimmed.replace(/^<\/\w+\s*>$/, "").trim()
        );
        level = Math.max(0, level);
        lines.push(indentStr.repeat(level) + `</${rawTagName}>`);
        continue;
      }
      lines.push(indentStr.repeat(level + 1) + trimmed);
      continue;
    }

    // Comment
    if (trimmed.startsWith("<!--")) {
      lines.push(indentStr.repeat(level) + trimmed);
      continue;
    }

    // Doctype
    if (trimmed.startsWith("<!")) {
      lines.push(indentStr.repeat(level) + trimmed);
      continue;
    }

    // Closing tag
    if (trimmed.startsWith("</")) {
      level = Math.max(0, level - 1);
      lines.push(indentStr.repeat(level) + trimmed);
      continue;
    }

    // Opening tag
    if (trimmed.startsWith("<")) {
      const tagMatch = trimmed.match(/^<(\w+)/);
      if (tagMatch && tagMatch[1]) {
        const tagName = tagMatch[1].toLowerCase();
        const isSelfClosing =
          trimmed.endsWith("/>") || VOID_ELEMENTS.has(tagName);

        lines.push(indentStr.repeat(level) + trimmed);

        if (!isSelfClosing) {
          if (RAW_TEXT_ELEMENTS.has(tagName)) {
            inRawElement = true;
            rawTagName = tagName;
          }
          level++;
        }
        continue;
      }
    }

    // Text content
    lines.push(indentStr.repeat(level) + trimmed);
  }

  return { output: lines.join("\n") };
}

export const htmlFormatter = defineTool({
  meta: {
    id: "html/formatter",
    name: "HTML Formatter",
    description:
      "Free online HTML formatter — prettify and indent HTML instantly in your browser. No data is stored. Handles nested tags, void elements, doctypes, comments, and preserves raw content in script/style/pre blocks.",
    category: "html",
    tier: ToolTier.CLIENT,
    keywords: [
      "html",
      "format",
      "prettify",
      "beautify",
      "indent",
      "pretty print",
      "minified",
      "readable",
      "code style",
    ],
    examples: [
      {
        title: "Prettify minified HTML",
        description:
          "Add proper indentation and line breaks to compressed HTML",
        input: "<div><h1>Title</h1><p>Paragraph</p></div>",
        output:
          "<div>\n  <h1>\n    Title\n  </h1>\n  <p>\n    Paragraph\n  </p>\n</div>",
      },
    ],
    ui: {
      inputLanguage: "html",
      outputLanguage: "html",
    },
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
