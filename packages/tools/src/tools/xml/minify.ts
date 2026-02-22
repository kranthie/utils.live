import { z } from "zod";
import { XMLParser, XMLBuilder } from "fast-xml-parser";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { XML_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("XML string to minify"),
});

const outputSchema = z.object({
  output: z.string().describe("Minified XML string"),
  originalSize: z.number().describe("Original size in bytes"),
  minifiedSize: z.number().describe("Minified size in bytes"),
  reduction: z.number().describe("Size reduction percentage"),
});

const optionsSchema = z.object({
  removeComments: z.boolean().default(true).describe("Remove XML comments"),
  preserveDeclaration: z
    .boolean()
    .default(true)
    .describe("Preserve XML declaration"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Minifies XML by removing whitespace.
 */
function execute(input: Input, options?: Options): Output {
  const removeComments = options?.removeComments ?? true;
  const preserveDeclaration = options?.preserveDeclaration ?? true;

  const originalSize = new TextEncoder().encode(input.input).length;

  try {
    // Pre-process to remove comments if needed
    let processedInput = input.input;
    if (removeComments) {
      processedInput = processedInput.replace(/<!--[\s\S]*?-->/g, "");
    }

    const parser = new XMLParser({
      ignoreAttributes: false,
      preserveOrder: true,
      trimValues: true,
    });

    const parsed: unknown = parser.parse(processedInput);

    const builder = new XMLBuilder({
      format: false,
      ignoreAttributes: false,
      preserveOrder: true,
      suppressEmptyNode: false,
    });

    let output = String(builder.build(parsed));

    // Handle XML declaration
    const hasDeclaration = input.input.trim().startsWith("<?xml");
    if (hasDeclaration && preserveDeclaration) {
      const declarationMatch = input.input.match(/<\?xml[^?]*\?>/);
      if (declarationMatch && !output.startsWith("<?xml")) {
        output = declarationMatch[0] + output;
      }
    }

    const minifiedSize = new TextEncoder().encode(output).length;
    const reduction =
      originalSize > 0
        ? Math.round(((originalSize - minifiedSize) / originalSize) * 100)
        : 0;

    return {
      output,
      originalSize,
      minifiedSize,
      reduction,
    };
  } catch (err) {
    throw createToolError({
      code: XML_PARSE_ERROR,
      message: `Invalid XML: ${err instanceof Error ? err.message : "Parse error"}`,
    });
  }
}

/**
 * XML Minify tool.
 * Minifies XML by removing whitespace.
 */
export const xmlMinify = defineTool({
  meta: {
    id: "xml/minify",
    name: "XML Minify",
    description:
      "Free online XML minifier — remove whitespace, comments, and indentation from XML documents instantly in your browser. No data is stored. Shows original vs minified size with reduction percentage.",
    category: "xml",
    tier: ToolTier.CLIENT,
    keywords: [
      "xml",
      "minify",
      "compact",
      "compress",
      "reduce",
      "size",
      "strip",
      "whitespace",
    ],
    examples: [
      {
        title: "Minify indented XML with comments",
        description:
          "Remove whitespace, indentation, and comments from a formatted XML document to reduce size by 24%",
        input:
          "<project>\n  <modelVersion>4.0.0</modelVersion>\n  <!-- Project coordinates -->\n  <groupId>com.example</groupId>\n  <artifactId>my-app</artifactId>\n  <version>1.0.0</version>\n</project>",
        output:
          '{"output":"<project><modelVersion>4.0.0</modelVersion><groupId>com.example</groupId><artifactId>my-app</artifactId><version>1.0.0</version></project>","originalSize":182,"minifiedSize":138,"reduction":24}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
