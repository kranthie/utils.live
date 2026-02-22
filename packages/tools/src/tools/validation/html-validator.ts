import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("HTML string to validate"),
});
const outputSchema = z.object({
  output: z.string().describe("Validation result"),
  isValid: z.boolean(),
  errors: z.array(z.string()).optional(),
});

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

export const htmlValidator = defineTool({
  meta: {
    id: "validation/html-validator",
    name: "HTML Validator",
    description:
      "Free online HTML validator — check your HTML for tag matching and structural errors instantly in your browser. No data is stored. Validates opening and closing tag pairs, nesting, and self-closing elements.",
    category: "validation",
    subgroup: "Data Validators",
    tier: ToolTier.CLIENT,
    keywords: [
      "html",
      "validate",
      "structure",
      "tags",
      "markup",
      "nesting",
      "elements",
      "web",
    ],
    examples: [
      {
        title: "Valid HTML",
        description: "Validate properly nested HTML tags",
        input: "<div><h1>Title</h1><p>Hello, <strong>world</strong>!</p></div>",
        output: "Valid HTML structure",
      },
      {
        title: "Unclosed Tag",
        description: "Detect an unclosed HTML tag",
        input: "<div><p>Missing closing div",
        output: "HTML issues:\n  - Unclosed tag: <div>\n  - Unclosed tag: <p>",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const html = input.input;
    const errors: string[] = [];
    const tagStack: string[] = [];

    // Remove comments, doctypes, and script/style content
    const cleaned = html
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<!DOCTYPE[^>]*>/gi, "")
      .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "");

    const tagRe = /<\/?([a-zA-Z][a-zA-Z0-9]*)([\s\S]*?)(\/?)\s*>/g;
    let match;
    while ((match = tagRe.exec(cleaned)) !== null) {
      const name = (match[1] ?? "").toLowerCase();
      const selfClosing = match[3] === "/";
      const isClosing = match[0].startsWith("</");

      if (VOID_ELEMENTS.has(name)) continue;

      if (isClosing) {
        if (tagStack.length === 0) {
          errors.push(`Unexpected closing tag </${name}>`);
        } else if (tagStack[tagStack.length - 1] !== name) {
          errors.push(
            `Mismatched tag: expected </${tagStack[tagStack.length - 1]}>, got </${name}>`
          );
          // Try to recover by popping
          const idx = tagStack.lastIndexOf(name);
          if (idx >= 0) tagStack.length = idx;
        } else {
          tagStack.pop();
        }
      } else if (!selfClosing) {
        tagStack.push(name);
      }
    }

    for (const tag of tagStack) {
      errors.push(`Unclosed tag: <${tag}>`);
    }

    const isValid = errors.length === 0;
    return {
      output: isValid
        ? "Valid HTML structure"
        : `HTML issues:\n${errors.map((e) => `  - ${e}`).join("\n")}`,
      isValid,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
});
