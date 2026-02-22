import { z } from "zod";
import yaml from "js-yaml";
import { XMLBuilder } from "fast-xml-parser";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { YAML_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("YAML string to convert to XML"),
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
 * Converts YAML to XML format.
 */
function execute(input: Input, options?: Options): Output {
  const rootName = options?.rootName ?? "root";
  const arrayNodeName = options?.arrayNodeName ?? "item";
  const indent = options?.indent ?? "  ";
  const declaration = options?.declaration ?? true;

  try {
    const parsed: unknown = yaml.load(input.input);

    const builder = new XMLBuilder({
      format: true,
      indentBy: indent,
      arrayNodeName,
      suppressEmptyNode: false,
      ignoreAttributes: false,
    });

    const wrapped = { [rootName]: parsed };
    let output = String(builder.build(wrapped));

    if (declaration) {
      output = `<?xml version="1.0" encoding="UTF-8"?>\n${output}`;
    }

    return { output: output.trim() };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid YAML format";
    throw createToolError({
      code: YAML_PARSE_ERROR,
      message: `Invalid YAML: ${message}`,
    });
  }
}

/**
 * YAML to XML tool.
 * Converts YAML to XML format.
 */
export const yamlToXml = defineTool({
  meta: {
    id: "yaml/to-xml",
    name: "YAML to XML",
    description:
      "Free online YAML to XML converter — paste YAML and get XML output instantly in your browser. No data is stored. Configurable root element name, array node naming, indentation, and optional XML declaration.",
    category: "yaml",
    tier: ToolTier.CLIENT,
    keywords: [
      "yaml",
      "xml",
      "convert",
      "transform",
      "config",
      "serialization",
      "data-interchange",
    ],
    examples: [
      {
        title: "Server config to XML",
        description:
          "Convert a YAML server configuration with nested objects to XML with declaration",
        input:
          "server:\n  host: localhost\n  port: 3000\n  paths:\n    - /api\n    - /health",
        output:
          '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <server>\n    <host>localhost</host>\n    <port>3000</port>\n    <paths>/api</paths>\n    <paths>/health</paths>\n  </server>\n</root>',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
