import { z } from "zod";
import { XMLParser } from "fast-xml-parser";
import yaml from "js-yaml";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { XML_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("XML string to convert to YAML"),
});

const outputSchema = z.object({
  output: z.string().describe("YAML string"),
});

const optionsSchema = z.object({
  indent: z
    .number()
    .int()
    .min(1)
    .max(8)
    .default(2)
    .describe("YAML indentation spaces"),
  ignoreAttributes: z
    .boolean()
    .default(false)
    .describe("Ignore XML attributes"),
  attributeNamePrefix: z
    .string()
    .default("@_")
    .describe("Prefix for attribute names"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Converts XML to YAML format.
 */
function execute(input: Input, options?: Options): Output {
  const indent = options?.indent ?? 2;
  const ignoreAttributes = options?.ignoreAttributes ?? false;
  const attributeNamePrefix = options?.attributeNamePrefix ?? "@_";

  try {
    const parser = new XMLParser({
      ignoreAttributes,
      attributeNamePrefix,
      trimValues: true,
    });

    const parsed: unknown = parser.parse(input.input);
    const output = yaml.dump(parsed, {
      indent,
      noRefs: true,
    });

    return { output };
  } catch (err) {
    throw createToolError({
      code: XML_PARSE_ERROR,
      message: `Invalid XML: ${err instanceof Error ? err.message : "Parse error"}`,
    });
  }
}

/**
 * XML to YAML tool.
 * Converts XML to YAML format.
 */
export const xmlToYaml = defineTool({
  meta: {
    id: "xml/to-yaml",
    name: "XML to YAML",
    description:
      "Free online XML to YAML converter — transform XML documents into YAML format instantly in your browser. No data is stored. Preserves attributes with configurable prefixes and supports custom indentation.",
    category: "xml",
    tier: ToolTier.CLIENT,
    keywords: [
      "xml",
      "yaml",
      "convert",
      "transform",
      "config",
      "migration",
      "parser",
    ],
    examples: [
      {
        title: ".NET app config to YAML",
        description:
          "Convert a .NET-style XML configuration with attributes to YAML format",
        input:
          '<configuration>\n  <appSettings>\n    <add key="AppName" value="MyWebApp"/>\n    <add key="Version" value="2.1.0"/>\n  </appSettings>\n  <connectionStrings>\n    <add name="DefaultDB" connectionString="Server=db.example.com;Database=mydb"/>\n  </connectionStrings>\n</configuration>',
        output:
          "configuration:\n  appSettings:\n    add:\n      - '@_key': AppName\n        '@_value': MyWebApp\n      - '@_key': Version\n        '@_value': 2.1.0\n  connectionStrings:\n    add:\n      '@_name': DefaultDB\n      '@_connectionString': Server=db.example.com;Database=mydb\n",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
