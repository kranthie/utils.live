import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("HTML string to validate"),
});

const outputSchema = z.object({
  output: z.string().describe("Validation result"),
  valid: z.boolean().describe("Whether the HTML is valid"),
  errors: z.array(z.string()).describe("List of validation errors"),
  warnings: z.array(z.string()).describe("List of validation warnings"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

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

function execute(input: Input): Output {
  const raw = input.input;
  if (!raw.trim()) {
    throw new Error("Input cannot be empty");
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  const tagStack: { name: string; line: number }[] = [];

  const lines = raw.split("\n");

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];
    const lineNo = lineNum + 1;

    // Find all tags in this line
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*\/?>/g;
    let match;

    while ((match = tagRegex.exec(line!)) !== null) {
      const fullTag = match[0];
      const tagName = (match[1] ?? "").toLowerCase();

      // Skip comments and doctype
      if (fullTag.startsWith("<!--") || fullTag.startsWith("<!")) continue;

      if (fullTag.startsWith("</")) {
        // Closing tag
        if (VOID_ELEMENTS.has(tagName)) {
          errors.push(
            `Line ${lineNo}: Void element <${tagName}> should not have a closing tag`
          );
          continue;
        }

        if (tagStack.length === 0) {
          errors.push(`Line ${lineNo}: Unexpected closing tag </${tagName}>`);
          continue;
        }

        const last = tagStack[tagStack.length - 1];
        if (last && last.name === tagName) {
          tagStack.pop();
        } else {
          // Try to find a match further up the stack
          let idx = -1;
          for (let j = tagStack.length - 1; j >= 0; j--) {
            const entry = tagStack[j];
            if (entry && entry.name === tagName) {
              idx = j;
              break;
            }
          }
          if (idx >= 0) {
            // Everything between is unclosed
            for (let i = tagStack.length - 1; i > idx; i--) {
              const entry = tagStack[i];
              if (entry) {
                errors.push(`Line ${entry.line}: Unclosed tag <${entry.name}>`);
              }
            }
            tagStack.splice(idx);
          } else {
            errors.push(`Line ${lineNo}: Unexpected closing tag </${tagName}>`);
          }
        }
      } else if (!fullTag.endsWith("/>") && !VOID_ELEMENTS.has(tagName)) {
        // Opening tag (not self-closing, not void)
        tagStack.push({ name: tagName, line: lineNo });
      }
    }

    // Check for duplicate IDs (basic check)
    const idRegex = /\bid\s*=\s*["']([^"']+)["']/gi;
    const ids = new Set<string>();
    let idMatch;
    while ((idMatch = idRegex.exec(line!)) !== null) {
      const id = idMatch[1] ?? "";
      if (ids.has(id)) {
        warnings.push(`Line ${lineNo}: Duplicate ID "${id}"`);
      }
      ids.add(id);
    }

    // Check for missing alt on img
    if (/<img\b/i.test(line!) && !/\balt\s*=/i.test(line!)) {
      warnings.push(`Line ${lineNo}: <img> tag missing alt attribute`);
    }
  }

  // Any remaining unclosed tags
  for (const tag of tagStack) {
    errors.push(`Line ${tag.line}: Unclosed tag <${tag.name}>`);
  }

  const valid = errors.length === 0;
  const parts: string[] = [];
  if (valid) {
    parts.push("HTML is valid!");
  } else {
    parts.push(`Found ${errors.length} error(s)`);
  }
  if (warnings.length > 0) {
    parts.push(`${warnings.length} warning(s)`);
  }

  if (errors.length > 0) {
    parts.push("\nErrors:");
    parts.push(...errors.map((e) => `  - ${e}`));
  }
  if (warnings.length > 0) {
    parts.push("\nWarnings:");
    parts.push(...warnings.map((w) => `  - ${w}`));
  }

  return { output: parts.join("\n"), valid, errors, warnings };
}

export const htmlValidator = defineTool({
  meta: {
    id: "html/validator",
    name: "HTML Validator",
    description:
      "Free online HTML validator — check HTML structure for errors and warnings instantly in your browser. No data is stored. Detects unclosed tags, mismatched nesting, missing alt attributes, duplicate IDs, and void element misuse.",
    category: "html",
    tier: ToolTier.CLIENT,
    keywords: [
      "html",
      "validate",
      "check",
      "lint",
      "tags",
      "structure",
      "unclosed tags",
      "accessibility",
      "alt attribute",
      "W3C",
    ],
    examples: [
      {
        title: "Check for common HTML errors",
        description: "Detect unclosed tags and missing alt attributes in HTML",
        input: '<div><p>Hello</div><img src="photo.jpg">',
        output:
          "Found 1 error(s)\n1 warning(s)\n\nErrors:\n  - Line 1: Unclosed tag <p>\n\nWarnings:\n  - Line 1: <img> tag missing alt attribute",
      },
    ],
    ui: {
      inputLanguage: "html",
    },
  },
  inputSchema,
  outputSchema,
  execute,
});
