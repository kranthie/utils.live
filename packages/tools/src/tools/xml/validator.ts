import { z } from "zod";
import { XMLParser, XMLValidator as FastXMLValidator } from "fast-xml-parser";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("XML string to validate"),
});

const outputSchema = z.object({
  valid: z.boolean().describe("Whether the XML is valid"),
  error: z.string().optional().describe("Error message if invalid"),
  line: z.number().optional().describe("Error line number if available"),
  column: z.number().optional().describe("Error column number if available"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Validates an XML string.
 */
function execute(input: Input): Output {
  const result = FastXMLValidator.validate(input.input, {
    allowBooleanAttributes: true,
  });

  if (result === true) {
    // Try parsing to catch additional errors
    try {
      const parser = new XMLParser();
      parser.parse(input.input);
      return { valid: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid XML";
      return {
        valid: false,
        error: message,
      };
    }
  }

  // result is an error object
  const error = result as { err: { msg: string; line?: number; col?: number } };
  return {
    valid: false,
    error: error.err.msg,
    line: error.err.line,
    column: error.err.col,
  };
}

/**
 * XML Validator tool.
 * Validates XML syntax.
 */
export const xmlValidator = defineTool({
  meta: {
    id: "xml/validator",
    name: "XML Validator",
    description:
      "Free online XML validator — check XML documents for syntax errors instantly in your browser. No data is stored. Reports error location with line and column numbers for mismatched tags, unclosed elements, and malformed content.",
    category: "xml",
    tier: ToolTier.CLIENT,
    keywords: [
      "xml",
      "validate",
      "syntax",
      "check",
      "lint",
      "well-formed",
      "error",
      "parse",
    ],
    examples: [
      {
        title: "Valid book catalog XML",
        description: "Validate a well-formed XML document with attributes",
        input:
          '<?xml version="1.0" encoding="UTF-8"?>\n<catalog>\n  <book id="1">\n    <title>Clean Code</title>\n    <author>Robert C. Martin</author>\n    <year>2008</year>\n  </book>\n  <book id="2">\n    <title>The Pragmatic Programmer</title>\n    <author>David Thomas</author>\n    <year>1999</year>\n  </book>\n</catalog>',
        output: '{"valid":true}',
      },
      {
        title: "Detect unclosed element tag",
        description:
          "Catch a missing closing tag with line and column error position",
        input: "<root>\n  <item>unclosed\n  <other>text</other>\n</root>",
        output:
          '{"valid":false,"error":"Expected closing tag \'item\' (opened in line 2, col 3) instead of closing tag \'root\'.","line":4,"column":1}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
