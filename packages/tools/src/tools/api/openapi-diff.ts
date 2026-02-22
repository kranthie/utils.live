import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input1: z.string().describe("First OpenAPI spec (JSON)"),
  input2: z.string().describe("Second OpenAPI spec (JSON)"),
});

const outputSchema = z.object({
  original: z.string().describe("Summary of first spec"),
  modified: z.string().describe("Summary of second spec"),
  differences: z
    .array(
      z.object({
        path: z.string(),
        type: z.enum(["added", "removed", "changed"]),
        details: z.string(),
      })
    )
    .describe("List of differences"),
  summary: z.object({
    added: z.number(),
    removed: z.number(),
    changed: z.number(),
  }),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

interface Diff {
  path: string;
  type: "added" | "removed" | "changed";
  details: string;
}

function compareDeep(
  obj1: unknown,
  obj2: unknown,
  path: string,
  diffs: Diff[]
): void {
  if (obj1 === obj2) return;

  const type1 = typeof obj1;
  const type2 = typeof obj2;

  if (type1 !== type2 || Array.isArray(obj1) !== Array.isArray(obj2)) {
    diffs.push({
      path,
      type: "changed",
      details: `Type changed from ${type1} to ${type2}`,
    });
    return;
  }

  if (type1 !== "object" || obj1 === null || obj2 === null) {
    if (obj1 !== obj2) {
      diffs.push({
        path,
        type: "changed",
        details: `Value changed from ${JSON.stringify(obj1)} to ${JSON.stringify(obj2)}`,
      });
    }
    return;
  }

  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    const max = Math.max(obj1.length, obj2.length);
    for (let i = 0; i < max; i++) {
      if (i >= obj1.length) {
        diffs.push({
          path: `${path}[${i}]`,
          type: "added",
          details: `New array element added`,
        });
      } else if (i >= obj2.length) {
        diffs.push({
          path: `${path}[${i}]`,
          type: "removed",
          details: `Array element removed`,
        });
      } else {
        compareDeep(obj1[i], obj2[i], `${path}[${i}]`, diffs);
      }
    }
    return;
  }

  const record1 = obj1 as Record<string, unknown>;
  const record2 = obj2 as Record<string, unknown>;
  const allKeys = new Set([...Object.keys(record1), ...Object.keys(record2)]);

  for (const key of allKeys) {
    const newPath = `${path}.${key}`;
    if (!(key in record1)) {
      diffs.push({
        path: newPath,
        type: "added",
        details: `New property added`,
      });
    } else if (!(key in record2)) {
      diffs.push({
        path: newPath,
        type: "removed",
        details: `Property removed`,
      });
    } else {
      compareDeep(record1[key], record2[key], newPath, diffs);
    }
  }
}

function getSpecSummary(spec: Record<string, unknown>): string {
  const info = spec.info as Record<string, unknown> | undefined;
  const title = typeof info?.title === "string" ? info.title : "Untitled";
  const version = typeof info?.version === "string" ? info.version : "unknown";
  const paths = spec.paths
    ? Object.keys(spec.paths as Record<string, unknown>).length
    : 0;
  return `${title} v${version} (${paths} paths)`;
}

function execute(input: Input): Output {
  if (!input.input1.trim() || !input.input2.trim()) {
    throw new Error("Both inputs are required");
  }

  let spec1: Record<string, unknown>;
  let spec2: Record<string, unknown>;

  try {
    spec1 = JSON.parse(input.input1) as Record<string, unknown>;
  } catch {
    throw new Error("Invalid JSON in first input");
  }

  try {
    spec2 = JSON.parse(input.input2) as Record<string, unknown>;
  } catch {
    throw new Error("Invalid JSON in second input");
  }

  const diffs: Diff[] = [];
  compareDeep(spec1, spec2, "$", diffs);

  return {
    original: getSpecSummary(spec1),
    modified: getSpecSummary(spec2),
    differences: diffs,
    summary: {
      added: diffs.filter((d) => d.type === "added").length,
      removed: diffs.filter((d) => d.type === "removed").length,
      changed: diffs.filter((d) => d.type === "changed").length,
    },
  };
}

export const openapiDiff = defineTool({
  meta: {
    id: "api/openapi-diff",
    name: "OpenAPI Diff",
    description:
      "Free online OpenAPI diff tool — compare two OpenAPI specifications side by side and detect added, removed, and changed paths, schemas, and properties instantly in your browser. No data is stored.",
    category: "api",
    subgroup: "OpenAPI",
    tier: ToolTier.CLIENT,
    keywords: [
      "openapi",
      "diff",
      "compare",
      "swagger",
      "api",
      "changes",
      "breaking",
      "version",
    ],
    examples: [
      {
        title: "Compare API Versions",
        description:
          "Detect differences between two versions of an OpenAPI spec",
        input: {
          input1:
            '{"openapi":"3.0.3","info":{"title":"API","version":"1.0.0"},"paths":{"/users":{"get":{"summary":"List users"}}}}',
          input2:
            '{"openapi":"3.0.3","info":{"title":"API","version":"2.0.0"},"paths":{"/users":{"get":{"summary":"List all users"}},"/posts":{"get":{"summary":"List posts"}}}}',
        },
        output:
          '{\n  "original": "API v1.0.0 (1 paths)",\n  "modified": "API v2.0.0 (2 paths)",\n  "differences": [\n    {\n      "path": "$.info.version",\n      "type": "changed",\n      "details": "Value changed from \\"1.0.0\\" to \\"2.0.0\\""\n    },\n    {\n      "path": "$.paths./users.get.summary",\n      "type": "changed",\n      "details": "Value changed from \\"List users\\" to \\"List all users\\""\n    },\n    {\n      "path": "$.paths./posts",\n      "type": "added",\n      "details": "New property added"\n    }\n  ],\n  "summary": {\n    "added": 1,\n    "removed": 0,\n    "changed": 2\n  }\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
