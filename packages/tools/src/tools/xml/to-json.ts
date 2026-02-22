import { z } from "zod";
import { XMLParser } from "fast-xml-parser";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { XML_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("XML string to convert to JSON"),
});

const outputSchema = z.object({
  output: z.string().describe("JSON string"),
});

const optionsSchema = z.object({
  indent: z
    .number()
    .int()
    .min(0)
    .max(8)
    .default(2)
    .describe("JSON indentation spaces"),
  ignoreAttributes: z
    .boolean()
    .default(false)
    .describe("Ignore XML attributes"),
  attributeNamePrefix: z
    .string()
    .default("@_")
    .describe("Prefix for attribute names"),
  textNodeName: z.string().default("#text").describe("Name for text nodes"),
  removeNSPrefix: z
    .boolean()
    .default(false)
    .describe("Remove namespace prefixes"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Converts XML to JSON format.
 */
function execute(input: Input, options?: Options): Output {
  const indent = options?.indent ?? 2;
  const ignoreAttributes = options?.ignoreAttributes ?? false;
  const attributeNamePrefix = options?.attributeNamePrefix ?? "@_";
  const textNodeName = options?.textNodeName ?? "#text";
  const removeNSPrefix = options?.removeNSPrefix ?? false;

  try {
    const parser = new XMLParser({
      ignoreAttributes,
      attributeNamePrefix,
      textNodeName,
      removeNSPrefix,
      trimValues: true,
    });

    const parsed: unknown = parser.parse(input.input);
    const output = JSON.stringify(parsed, null, indent);

    return { output };
  } catch (err) {
    throw createToolError({
      code: XML_PARSE_ERROR,
      message: `Invalid XML: ${err instanceof Error ? err.message : "Parse error"}`,
    });
  }
}

/**
 * XML to JSON tool.
 * Converts XML to JSON format.
 */
export const xmlToJson = defineTool({
  meta: {
    id: "xml/to-json",
    name: "XML to JSON",
    description:
      "Free online XML to JSON converter — transform XML documents into JSON objects instantly in your browser. No data is stored. Supports attributes, namespaces, configurable indentation, and text node naming.",
    category: "xml",
    tier: ToolTier.CLIENT,
    keywords: [
      "xml",
      "json",
      "convert",
      "transform",
      "parser",
      "api",
      "soap",
      "config",
    ],
    examples: [
      {
        title: "Java web.xml servlet config",
        description:
          "Convert a web.xml servlet configuration to a JSON object preserving element hierarchy",
        input:
          "<web-app>\n  <servlet>\n    <servlet-name>dispatcher</servlet-name>\n    <servlet-class>org.springframework.web.servlet.DispatcherServlet</servlet-class>\n    <load-on-startup>1</load-on-startup>\n  </servlet>\n  <servlet-mapping>\n    <servlet-name>dispatcher</servlet-name>\n    <url-pattern>/api/*</url-pattern>\n  </servlet-mapping>\n</web-app>",
        output:
          '{\n  "web-app": {\n    "servlet": {\n      "servlet-name": "dispatcher",\n      "servlet-class": "org.springframework.web.servlet.DispatcherServlet",\n      "load-on-startup": 1\n    },\n    "servlet-mapping": {\n      "servlet-name": "dispatcher",\n      "url-pattern": "/api/*"\n    }\n  }\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
