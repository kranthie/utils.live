import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { JSON_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input1: z.string().describe("First JSON string"),
  input2: z.string().describe("Second JSON string"),
});

const outputSchema = z.object({
  identical: z.boolean().describe("Whether the JSONs are identical"),
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
      const newPath = `${path}.${key}`;
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
 * Compares two JSON objects and returns differences.
 */
function execute(input: Input): Output {
  let parsed1: unknown;
  let parsed2: unknown;

  try {
    parsed1 = JSON.parse(input.input1);
  } catch (err) {
    throw createToolError({
      code: JSON_PARSE_ERROR,
      message: `Invalid JSON in first input: ${err instanceof Error ? err.message : "Parse error"}`,
    });
  }

  try {
    parsed2 = JSON.parse(input.input2);
  } catch (err) {
    throw createToolError({
      code: JSON_PARSE_ERROR,
      message: `Invalid JSON in second input: ${err instanceof Error ? err.message : "Parse error"}`,
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
 * JSON Diff tool.
 * Compares two JSON objects and shows differences.
 */
export const jsonDiff = defineTool({
  meta: {
    id: "json/diff",
    name: "JSON Diff",
    description:
      "Free online JSON diff tool — compare two JSON objects and show added, removed, and changed fields instantly in your browser. No data is stored. Reports differences with JSON path locations.",
    category: "json",
    subgroup: "Core",
    tier: ToolTier.CLIENT,
    keywords: ["json", "diff", "compare", "difference", "merge"],
    examples: [
      {
        title: "Changed Fields",
        description: "Compare two user objects with different values",
        input: {
          input1: '{"name": "Alice", "age": 30, "city": "Portland"}',
          input2: '{"name": "Alice", "age": 31, "city": "Seattle"}',
        },
        output:
          '{\n  "identical": false,\n  "differences": [\n    {\n      "path": "$.age",\n      "type": "changed",\n      "oldValue": 30,\n      "newValue": 31\n    },\n    {\n      "path": "$.city",\n      "type": "changed",\n      "oldValue": "Portland",\n      "newValue": "Seattle"\n    }\n  ],\n  "summary": {\n    "added": 0,\n    "removed": 0,\n    "changed": 2,\n    "total": 2\n  }\n}',
      },
      {
        title: "Added and Removed Keys",
        description: "Detect keys added or removed between two JSON objects",
        input: {
          input1: '{"id": 1, "name": "Alice", "role": "admin"}',
          input2: '{"id": 1, "name": "Alice", "email": "alice@example.com"}',
        },
        output:
          '{\n  "identical": false,\n  "differences": [\n    {\n      "path": "$.role",\n      "type": "removed",\n      "oldValue": "admin"\n    },\n    {\n      "path": "$.email",\n      "type": "added",\n      "newValue": "alice@example.com"\n    }\n  ],\n  "summary": {\n    "added": 1,\n    "removed": 1,\n    "changed": 0,\n    "total": 2\n  }\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
