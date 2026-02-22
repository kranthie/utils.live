import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { XMLParser } from "fast-xml-parser";

const inputSchema = z.object({
  input: z.string().describe("XML string to validate"),
});
const outputSchema = z.object({
  output: z.string().describe("Validation result"),
  isValid: z.boolean(),
  errors: z.array(z.string()).optional(),
});

export const xmlValidator = defineTool({
  meta: {
    id: "validation/xml-validator",
    name: "XML Validator",
    description:
      "Free online XML validator — check your XML documents for well-formedness errors instantly in your browser. No data is stored. Validates tag matching, proper nesting, and XML declaration syntax.",
    category: "validation",
    subgroup: "Data Validators",
    tier: ToolTier.CLIENT,
    keywords: [
      "xml",
      "validate",
      "wellformed",
      "syntax",
      "markup",
      "document",
      "tags",
      "schema",
    ],
    examples: [
      {
        title: "Valid XML",
        description: "Validate a well-formed XML document",
        input:
          '<?xml version="1.0"?>\n<catalog>\n  <book id="1">\n    <title>XML Developer\'s Guide</title>\n    <author>Gambardella, Matthew</author>\n  </book>\n</catalog>',
        output: "Valid XML",
      },
      {
        title: "Mismatched Tags",
        description: "Detect mismatched XML tags",
        input: "<root><item>text</items></root>",
        output:
          "Invalid XML:\n  - Mismatched tag: expected </item>, got </items>",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const xml = input.input;
    if (!xml.trim()) {
      return {
        output: "Invalid XML:\n  - Empty XML",
        isValid: false,
        errors: ["Empty XML"],
      };
    }

    try {
      const parser = new XMLParser({
        allowBooleanAttributes: true,
        ignoreAttributes: false,
        parseAttributeValue: false,
        parseTagValue: false,
        // These options make the parser strict about well-formedness
        isArray: () => false,
        processEntities: true,
        htmlEntities: false,
      });

      // XMLParser with strict validation
      const result: unknown = parser.parse(xml);

      // Verify that at least one root element was found
      if (!result || typeof result !== "object") {
        return {
          output: "Invalid XML:\n  - No root element found",
          isValid: false,
          errors: ["No root element found"],
        };
      }

      // Additional checks: XML must have tags
      if (!/<[a-zA-Z_][\w.-]*/.test(xml)) {
        return {
          output: "Invalid XML:\n  - No root element found",
          isValid: false,
          errors: ["No root element found"],
        };
      }

      // Check for mismatched tags using a simple stack-based approach as a backup
      const errors = checkTagMatching(xml);
      if (errors.length > 0) {
        return {
          output: `Invalid XML:\n${errors.map((e) => `  - ${e}`).join("\n")}`,
          isValid: false,
          errors,
        };
      }

      return { output: "Valid XML", isValid: true };
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Unknown XML parsing error";
      return {
        output: `Invalid XML:\n  - ${message}`,
        isValid: false,
        errors: [message],
      };
    }
  },
});

/**
 * Stack-based tag matching for additional well-formedness checks.
 */
function checkTagMatching(xml: string): string[] {
  const errors: string[] = [];
  const tagStack: string[] = [];
  const tagRe = /<\/?([a-zA-Z_][\w.-]*)([\s\S]*?)(\/?)\s*>/g;
  let match;
  let hasRootElement = false;

  while ((match = tagRe.exec(xml)) !== null) {
    const full = match[0];
    const name = match[1] ?? "";
    const selfClosing = match[3] === "/";
    const isClosing = full.startsWith("</");

    // Skip processing instructions and comments
    if (full.startsWith("<?") || full.startsWith("<!")) continue;

    if (isClosing) {
      if (tagStack.length === 0) {
        errors.push(`Unexpected closing tag </${name}>`);
      } else if (tagStack[tagStack.length - 1] !== name) {
        errors.push(
          `Mismatched tag: expected </${tagStack[tagStack.length - 1]}>, got </${name}>`
        );
        tagStack.pop();
      } else {
        tagStack.pop();
      }
    } else if (!selfClosing) {
      tagStack.push(name);
      hasRootElement = true;
    } else {
      hasRootElement = true;
    }
  }

  if (!hasRootElement) errors.push("No root element found");
  for (const tag of tagStack) {
    errors.push(`Unclosed tag: <${tag}>`);
  }
  return errors;
}
