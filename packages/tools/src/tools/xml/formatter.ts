import { z } from "zod";
import { XMLParser, XMLBuilder } from "fast-xml-parser";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { XML_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("XML string to format"),
});

const outputSchema = z.object({
  output: z.string().describe("Formatted XML string"),
});

const optionsSchema = z.object({
  indent: z.string().default("  ").describe("Indentation string"),
  preserveOrder: z.boolean().default(false).describe("Preserve element order"),
  ignoreAttributes: z.boolean().default(false).describe("Ignore attributes"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Formats an XML string with configurable indentation.
 */
function execute(input: Input, options?: Options): Output {
  const indent = options?.indent ?? "  ";
  const preserveOrder = options?.preserveOrder ?? false;
  const ignoreAttributes = options?.ignoreAttributes ?? false;

  try {
    const parser = new XMLParser({
      ignoreAttributes,
      preserveOrder,
      trimValues: true,
    });

    const parsed: unknown = parser.parse(input.input);

    const builder = new XMLBuilder({
      format: true,
      indentBy: indent,
      ignoreAttributes,
      preserveOrder,
      suppressEmptyNode: false,
    });

    let output = String(builder.build(parsed));

    // Check if original had XML declaration
    if (input.input.trim().startsWith("<?xml")) {
      if (!output.trim().startsWith("<?xml")) {
        output = `<?xml version="1.0" encoding="UTF-8"?>\n${output}`;
      }
    }

    return { output: output.trim() };
  } catch (err) {
    throw createToolError({
      code: XML_PARSE_ERROR,
      message: `Invalid XML: ${err instanceof Error ? err.message : "Parse error"}`,
    });
  }
}

/**
 * XML Formatter tool.
 * Formats XML strings with configurable indentation.
 */
export const xmlFormatter = defineTool({
  meta: {
    id: "xml/formatter",
    name: "XML Formatter",
    description:
      "Free online XML formatter — prettify and indent XML documents instantly in your browser. No data is stored. Supports configurable indentation, attribute preservation, and element order control for pom.xml, web.xml, and other XML configs.",
    category: "xml",
    tier: ToolTier.CLIENT,
    keywords: [
      "xml",
      "format",
      "prettify",
      "beautify",
      "indent",
      "lint",
      "readable",
      "pom",
      "config",
    ],
    examples: [
      {
        title: "Prettify minified Maven pom.xml",
        description:
          "Format a single-line pom.xml with proper indentation to make it readable",
        input:
          "<project><modelVersion>4.0.0</modelVersion><groupId>com.example</groupId><artifactId>my-app</artifactId><version>1.0.0</version><dependencies><dependency><groupId>junit</groupId><artifactId>junit</artifactId><version>4.13</version></dependency></dependencies></project>",
        output:
          "<project>\n  <modelVersion>4.0.0</modelVersion>\n  <groupId>com.example</groupId>\n  <artifactId>my-app</artifactId>\n  <version>1.0.0</version>\n  <dependencies>\n    <dependency>\n      <groupId>junit</groupId>\n      <artifactId>junit</artifactId>\n      <version>4.13</version>\n    </dependency>\n  </dependencies>\n</project>",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
