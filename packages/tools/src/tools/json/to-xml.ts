import { z } from "zod";
import { XMLBuilder } from "fast-xml-parser";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { JSON_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("JSON string to convert to XML"),
});

const outputSchema = z.object({
  output: z.string().describe("XML string"),
});

const optionsSchema = z.object({
  rootName: z.string().default("root").describe("Name of the root element"),
  arrayNodeName: z.string().default("item").describe("Name for array items"),
  indent: z.string().default("  ").describe("Indentation string"),
  declaration: z.boolean().default(true).describe("Include XML declaration"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Converts JSON to XML format.
 */
function execute(input: Input, options?: Options): Output {
  const rootName = options?.rootName ?? "root";
  const arrayNodeName = options?.arrayNodeName ?? "item";
  const indent = options?.indent ?? "  ";
  const declaration = options?.declaration ?? true;

  try {
    const parsed: unknown = JSON.parse(input.input);

    const builder = new XMLBuilder({
      format: true,
      indentBy: indent,
      arrayNodeName,
      suppressEmptyNode: false,
      ignoreAttributes: false,
    });

    const wrapped = { [rootName]: parsed };
    let output = builder.build(wrapped);

    if (declaration) {
      output = `<?xml version="1.0" encoding="UTF-8"?>\n${output}`;
    }

    return { output: String(output).trim() };
  } catch (err) {
    throw createToolError({
      code: JSON_PARSE_ERROR,
      message: `Invalid JSON: ${err instanceof Error ? err.message : "Parse error"}`,
    });
  }
}

/**
 * JSON to XML tool.
 * Converts JSON to XML format.
 */
export const jsonToXml = defineTool({
  meta: {
    id: "json/to-xml",
    name: "JSON to XML",
    description:
      "Free online JSON to XML converter — convert JSON objects to XML format instantly in your browser. No data is stored. Configurable root element name, array node name, and XML declaration.",
    category: "json",
    subgroup: "Core",
    tier: ToolTier.CLIENT,
    keywords: ["json", "xml", "convert", "transform"],
    examples: [
      {
        title: "Simple Object",
        description: "Convert a JSON object to XML with a root element",
        input: '{"name": "Alice", "age": 30}',
        output:
          '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <name>Alice</name>\n  <age>30</age>\n</root>',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
