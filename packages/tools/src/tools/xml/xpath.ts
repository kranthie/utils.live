import { z } from "zod";
import { XMLParser, XMLBuilder } from "fast-xml-parser";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { XML_PARSE_ERROR, XML_XPATH_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("XML document"),
});

const optionsSchema = z.object({
  query: z
    .string()
    .default("/")
    .describe(
      "XPath-like query (simplified: /root/element, //element, element[@attr])"
    ),
});

const outputSchema = z.object({
  results: z.array(z.string()).describe("Matching nodes as XML strings"),
  count: z.number().describe("Number of matches"),
});

type Input = z.infer<typeof inputSchema>;
type Options = z.infer<typeof optionsSchema>;
type Output = z.infer<typeof outputSchema>;

interface ParsedNode {
  [key: string]: unknown;
}

/**
 * Simple XPath-like query implementation.
 * Supports: /path/to/element, //element, element[@attr], element[@attr='value']
 */
function queryXPath(obj: unknown, query: string): unknown[] {
  const results: unknown[] = [];

  // Parse query
  const isRecursive = query.startsWith("//");
  const cleanQuery = query.replace(/^\/+/, "");
  const parts = cleanQuery.split("/").filter(Boolean);

  if (parts.length === 0) {
    return [obj];
  }

  function traverse(node: unknown, pathIndex: number): void {
    if (pathIndex >= parts.length) {
      results.push(node);
      return;
    }

    const selector = parts[pathIndex];

    if (typeof node !== "object" || node === null) {
      return;
    }

    const nodeObj = node as ParsedNode;

    // Handle attribute selector
    const attrMatch = selector
      ? selector.match(/^(\w+)\[@(\w+)(?:='([^']*)')?\]$/)
      : null;
    const elementName = attrMatch ? attrMatch[1] : selector;

    if (elementName && elementName in nodeObj) {
      const child = nodeObj[elementName];

      if (Array.isArray(child)) {
        for (const item of child) {
          if (attrMatch) {
            const [, , attrName, attrValue] = attrMatch;
            const attrKey = `@_${attrName}`;
            const itemObj = item as ParsedNode;

            if (attrValue !== undefined) {
              if (itemObj[attrKey] === attrValue) {
                traverse(item, pathIndex + 1);
              }
            } else if (attrKey in itemObj) {
              traverse(item, pathIndex + 1);
            }
          } else {
            traverse(item, pathIndex + 1);
          }
        }
      } else if (attrMatch) {
        const [, , attrName, attrValue] = attrMatch;
        const attrKey = `@_${attrName}`;
        const childObj = child as ParsedNode;

        if (attrValue !== undefined) {
          if (childObj[attrKey] === attrValue) {
            traverse(child, pathIndex + 1);
          }
        } else if (attrKey in childObj) {
          traverse(child, pathIndex + 1);
        }
      } else {
        traverse(child, pathIndex + 1);
      }
    }

    // Recursive search for //
    if (isRecursive) {
      for (const [key, value] of Object.entries(nodeObj)) {
        if (key.startsWith("@_")) continue;

        if (Array.isArray(value)) {
          for (const item of value) {
            traverse(item, pathIndex);
          }
        } else if (typeof value === "object" && value !== null) {
          traverse(value, pathIndex);
        }
      }
    }
  }

  traverse(obj, 0);
  return results;
}

/**
 * Queries XML using XPath-like expressions.
 */
function execute(input: Input, options?: Options): Output {
  const query = options?.query ?? "/";

  let parsed: unknown;

  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      trimValues: true,
    });
    parsed = parser.parse(input.input);
  } catch (err) {
    throw createToolError({
      code: XML_PARSE_ERROR,
      message: `Invalid XML: ${err instanceof Error ? err.message : "Parse error"}`,
    });
  }

  if (!query.trim()) {
    throw createToolError({
      code: XML_XPATH_ERROR,
      message: "Query cannot be empty",
    });
  }

  try {
    const matches = queryXPath(parsed, query);

    const builder = new XMLBuilder({
      format: true,
      indentBy: "  ",
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    });

    const results: string[] = matches.map((match) => {
      if (typeof match === "object" && match !== null) {
        return String(builder.build(match)).trim();
      }
      return String(match);
    });

    return {
      results,
      count: results.length,
    };
  } catch (err) {
    throw createToolError({
      code: XML_XPATH_ERROR,
      message: `XPath query error: ${err instanceof Error ? err.message : "Unknown error"}`,
    });
  }
}

/**
 * XML XPath Query tool.
 * Queries XML using XPath-like expressions.
 */
export const xmlXpath = defineTool({
  meta: {
    id: "xml/xpath",
    name: "XML XPath Query",
    description:
      "Free online XML XPath query tool — extract nodes from XML documents using XPath-like expressions instantly in your browser. No data is stored. Supports absolute paths, recursive search (//), and attribute filters ([@attr='value']).",
    category: "xml",
    tier: ToolTier.CLIENT,
    keywords: [
      "xml",
      "xpath",
      "query",
      "extract",
      "search",
      "selector",
      "node",
      "filter",
    ],
    examples: [
      {
        title: "Find all admin users by role attribute",
        description:
          "Use XPath attribute filter to extract user elements with role='admin'",
        input:
          '<root>\n  <users>\n    <user id="1" role="admin"><name>Alice</name></user>\n    <user id="2" role="user"><name>Bob</name></user>\n    <user id="3" role="admin"><name>Carol</name></user>\n  </users>\n</root>',
        options: { query: "/root/users/user[@role='admin']" },
        output:
          '{"results":["<name>Alice</name>","<name>Carol</name>"],"count":2}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
