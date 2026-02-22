import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("HTML string to remove attributes from"),
});

const outputSchema = z.object({
  output: z.string().describe("HTML with specified attributes removed"),
  attributesRemoved: z.number().describe("Number of attributes removed"),
});

const optionsSchema = z.object({
  attributes: z
    .string()
    .default("style,onclick,onload")
    .describe("Comma-separated list of attributes to remove"),
  removeAllData: z
    .boolean()
    .default(false)
    .describe("Remove all data-* attributes"),
  removeAllEvents: z
    .boolean()
    .default(false)
    .describe("Remove all on* event attributes"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

function execute(input: Input, options?: Options): Output {
  const raw = input.input;
  if (!raw.trim()) {
    throw new Error("Input cannot be empty");
  }

  const attrsStr = options?.attributes ?? "style,onclick,onload";
  const removeAllData = options?.removeAllData ?? false;
  const removeAllEvents = options?.removeAllEvents ?? false;
  const attrs = attrsStr
    .split(",")
    .map((a) => a.trim().toLowerCase())
    .filter(Boolean);

  let attributesRemoved = 0;

  const result = raw.replace(
    /<([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g,
    (fullMatch: string, tagName: string, attrString: string) => {
      if (!attrString.trim()) return fullMatch;

      let modified: string = attrString;

      // Remove specific named attributes
      for (const attr of attrs) {
        const attrRegex = new RegExp(
          `\\s+${attr}\\s*=\\s*(?:"[^"]*"|'[^']*'|\\S+)`,
          "gi"
        );
        const matches = modified.match(attrRegex);
        if (matches) {
          attributesRemoved += matches.length;
          modified = modified.replace(attrRegex, "");
        }
        // Also handle boolean attributes (no value)
        const boolRegex = new RegExp(`\\s+${attr}(?=\\s|$|>|/)`, "gi");
        const boolMatches = modified.match(boolRegex);
        if (boolMatches) {
          attributesRemoved += boolMatches.length;
          modified = modified.replace(boolRegex, "");
        }
      }

      // Remove all data-* attributes
      if (removeAllData) {
        const dataRegex =
          /\s+data-[a-zA-Z0-9-]+\s*=\s*(?:"[^"]*"|'[^']*'|\S+)/gi;
        const dataMatches = modified.match(dataRegex);
        if (dataMatches) {
          attributesRemoved += dataMatches.length;
          modified = modified.replace(dataRegex, "");
        }
      }

      // Remove all on* event attributes
      if (removeAllEvents) {
        const eventRegex = /\s+on[a-zA-Z]+\s*=\s*(?:"[^"]*"|'[^']*'|\S+)/gi;
        const eventMatches = modified.match(eventRegex);
        if (eventMatches) {
          attributesRemoved += eventMatches.length;
          modified = modified.replace(eventRegex, "");
        }
      }

      return `<${tagName}${modified}>`;
    }
  );

  return { output: result, attributesRemoved };
}

export const htmlAttributeRemover = defineTool({
  meta: {
    id: "html/attribute-remover",
    name: "HTML Attribute Remover",
    description:
      "Free online HTML attribute remover — strip inline styles, event handlers, and data attributes from HTML instantly in your browser. No data is stored. Configurable attribute list, bulk removal of all data-* or on* attributes, and attribute count reporting.",
    category: "html",
    tier: ToolTier.CLIENT,
    keywords: [
      "html",
      "attribute",
      "remove",
      "strip",
      "clean",
      "sanitize",
      "inline style",
      "event handler",
      "data attribute",
      "onclick",
      "XSS",
      "security",
    ],
    examples: [
      {
        title: "Sanitize pasted HTML content",
        description:
          "Remove inline styles and event handlers from HTML copied from a webpage",
        input:
          '<div style="color:red" onclick="alert(1)"><p style="font-size:14px">Hello</p></div>',
        output: "<div><p>Hello</p></div>",
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
