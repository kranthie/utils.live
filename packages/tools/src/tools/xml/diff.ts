import { z } from "zod";
import { XMLParser } from "fast-xml-parser";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { XML_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input1: z.string().describe("First XML string"),
  input2: z.string().describe("Second XML string"),
});

const outputSchema = z.object({
  identical: z.boolean().describe("Whether the XMLs are identical"),
  differences: z
    .array(
      z.object({
        path: z.string(),
        type: z.enum(["added", "removed", "changed", "type_changed"]),
        oldValue: z.unknown().optional(),
        newValue: z.unknown().optional(),
      })
    )
    .describe("List of differences"),
  summary: z.object({
    added: z.number(),
    removed: z.number(),
    changed: z.number(),
    total: z.number(),
  }),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

interface Difference {
  path: string;
  type: "added" | "removed" | "changed" | "type_changed";
  oldValue?: unknown;
  newValue?: unknown;
}

function getType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function compareObjects(
  obj1: unknown,
  obj2: unknown,
  path: string = "$",
  differences: Difference[] = []
): Difference[] {
  const type1 = getType(obj1);
  const type2 = getType(obj2);

  if (type1 !== type2) {
    differences.push({
      path,
      type: "type_changed",
      oldValue: obj1,
      newValue: obj2,
    });
    return differences;
  }

  if (type1 === "object" && obj1 !== null && obj2 !== null) {
    const record1 = obj1 as Record<string, unknown>;
    const record2 = obj2 as Record<string, unknown>;
    const allKeys = new Set([...Object.keys(record1), ...Object.keys(record2)]);

    for (const key of allKeys) {
      const newPath = `${path}/${key}`;
      const hasKey1 = key in record1;
      const hasKey2 = key in record2;

      if (!hasKey1) {
        differences.push({
          path: newPath,
          type: "added",
          newValue: record2[key],
        });
      } else if (!hasKey2) {
        differences.push({
          path: newPath,
          type: "removed",
          oldValue: record1[key],
        });
      } else {
        compareObjects(record1[key], record2[key], newPath, differences);
      }
    }
  } else if (type1 === "array") {
    const arr1 = obj1 as unknown[];
    const arr2 = obj2 as unknown[];
    const maxLen = Math.max(arr1.length, arr2.length);

    for (let i = 0; i < maxLen; i++) {
      const newPath = `${path}[${i}]`;
      if (i >= arr1.length) {
        differences.push({ path: newPath, type: "added", newValue: arr2[i] });
      } else if (i >= arr2.length) {
        differences.push({ path: newPath, type: "removed", oldValue: arr1[i] });
      } else {
        compareObjects(arr1[i], arr2[i], newPath, differences);
      }
    }
  } else if (obj1 !== obj2) {
    differences.push({
      path,
      type: "changed",
      oldValue: obj1,
      newValue: obj2,
    });
  }

  return differences;
}

/**
 * Compares two XML documents and returns differences.
 */
function execute(input: Input): Output {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    trimValues: true,
  });

  let parsed1: unknown;
  let parsed2: unknown;

  try {
    parsed1 = parser.parse(input.input1);
  } catch (err) {
    throw createToolError({
      code: XML_PARSE_ERROR,
      message: `Invalid XML in first input: ${err instanceof Error ? err.message : "Parse error"}`,
    });
  }

  try {
    parsed2 = parser.parse(input.input2);
  } catch (err) {
    throw createToolError({
      code: XML_PARSE_ERROR,
      message: `Invalid XML in second input: ${err instanceof Error ? err.message : "Parse error"}`,
    });
  }

  const differences = compareObjects(parsed1, parsed2);
  const summary = {
    added: differences.filter((d) => d.type === "added").length,
    removed: differences.filter((d) => d.type === "removed").length,
    changed: differences.filter(
      (d) => d.type === "changed" || d.type === "type_changed"
    ).length,
    total: differences.length,
  };

  return {
    identical: differences.length === 0,
    differences,
    summary,
  };
}

/**
 * XML Diff tool.
 * Compares two XML documents and shows differences.
 */
export const xmlDiff = defineTool({
  meta: {
    id: "xml/diff",
    name: "XML Diff",
    description:
      "Free online XML diff tool — compare two XML documents and find structural differences instantly in your browser. No data is stored. Detects added, removed, and changed elements, attributes, and text nodes with XPath-style paths.",
    category: "xml",
    tier: ToolTier.CLIENT,
    keywords: [
      "xml",
      "diff",
      "compare",
      "difference",
      "structural",
      "merge",
      "config",
      "changes",
      "xpath",
    ],
    examples: [
      {
        title: "Server config with changed host and port",
        description:
          "Compare two XML server configs to find changed values, removed elements, and new additions",
        input: {
          input1:
            "<config>\n  <host>localhost</host>\n  <port>8080</port>\n  <debug>true</debug>\n</config>",
          input2:
            "<config>\n  <host>production.example.com</host>\n  <port>443</port>\n  <ssl>true</ssl>\n</config>",
        },
        output:
          '{\n  "identical": false,\n  "differences": [\n    {\n      "path": "$/config/host",\n      "type": "changed",\n      "oldValue": "localhost",\n      "newValue": "production.example.com"\n    },\n    {\n      "path": "$/config/port",\n      "type": "changed",\n      "oldValue": 8080,\n      "newValue": 443\n    },\n    {\n      "path": "$/config/debug",\n      "type": "removed",\n      "oldValue": true\n    },\n    {\n      "path": "$/config/ssl",\n      "type": "added",\n      "newValue": true\n    }\n  ],\n  "summary": {\n    "added": 1,\n    "removed": 1,\n    "changed": 2,\n    "total": 4\n  }\n}',
      },
    ],
    ui: {
      outputRenderer: "json-tree",
    },
  },
  inputSchema,
  outputSchema,
  execute,
});
