import { z } from "zod";
import yaml from "js-yaml";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { YAML_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input1: z.string().describe("First YAML string"),
  input2: z.string().describe("Second YAML string"),
});

const outputSchema = z.object({
  identical: z.boolean().describe("Whether the YAMLs are identical"),
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
 * Compares two YAML documents and returns differences.
 */
function execute(input: Input): Output {
  let parsed1: unknown;
  let parsed2: unknown;

  try {
    parsed1 = yaml.load(input.input1);
  } catch (err) {
    throw createToolError({
      code: YAML_PARSE_ERROR,
      message: `Invalid YAML in first input: ${err instanceof Error ? err.message : "Parse error"}`,
    });
  }

  try {
    parsed2 = yaml.load(input.input2);
  } catch (err) {
    throw createToolError({
      code: YAML_PARSE_ERROR,
      message: `Invalid YAML in second input: ${err instanceof Error ? err.message : "Parse error"}`,
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
 * YAML Diff tool.
 * Compares two YAML documents and shows differences.
 */
export const yamlDiff = defineTool({
  meta: {
    id: "yaml/diff",
    name: "YAML Diff",
    description:
      "Free online YAML diff tool — compare two YAML documents and see structural differences instantly in your browser. No data is stored. Shows added, removed, and changed keys by JSON path with a summary count.",
    category: "yaml",
    tier: ToolTier.CLIENT,
    keywords: [
      "yaml",
      "diff",
      "compare",
      "difference",
      "config",
      "merge",
      "structural",
      "deep-compare",
    ],
    ui: {
      outputRenderer: "json-tree",
    },
    examples: [
      {
        title: "Detect server config changes",
        description:
          "Compare two versions of a YAML server config to find changed host and port values",
        input: {
          input1:
            "server:\n  host: localhost\n  port: 3000\ndatabase:\n  url: postgres://localhost/dev\ndebug: true",
          input2:
            "server:\n  host: 0.0.0.0\n  port: 8080\ndatabase:\n  url: postgres://db.example.com/prod\ndebug: false",
        },
        output:
          '{"identical":false,"differences":[{"path":"$.server.host","type":"changed","oldValue":"localhost","newValue":"0.0.0.0"},{"path":"$.server.port","type":"changed","oldValue":3000,"newValue":8080},{"path":"$.database.url","type":"changed","oldValue":"postgres://localhost/dev","newValue":"postgres://db.example.com/prod"},{"path":"$.debug","type":"changed","oldValue":true,"newValue":false}],"summary":{"added":0,"removed":0,"changed":4,"total":4}}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
