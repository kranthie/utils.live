import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { JSON_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("JSON string to display as tree"),
});

const optionsSchema = z.object({
  maxDepth: z
    .number()
    .min(1)
    .max(20)
    .default(10)
    .describe("Maximum depth to display"),
  showTypes: z.boolean().default(true).describe("Show value types in output"),
  showValues: z.boolean().default(true).describe("Show primitive values"),
  indent: z.string().default("  ").describe("Indentation string"),
});

const outputSchema = z.object({
  output: z.string().describe("Tree representation of JSON"),
  nodeCount: z.number().describe("Total number of nodes"),
});

type Input = z.infer<typeof inputSchema>;
type Options = z.infer<typeof optionsSchema>;
type Output = z.infer<typeof outputSchema>;

interface TreeOptions {
  maxDepth: number;
  showTypes: boolean;
  showValues: boolean;
  indent: string;
}

/**
 * Builds a clean tree representation of JSON.
 */
function buildSimpleTree(
  value: unknown,
  options: TreeOptions,
  depth: number,
  nodeCountRef: { count: number }
): string[] {
  nodeCountRef.count++;

  if (depth > options.maxDepth) {
    return ["... (max depth)"];
  }

  if (value === null) {
    return [options.showTypes ? "null (null)" : "null"];
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return ["[] (empty)"];
    }

    const lines: string[] = [`Array[${value.length}]`];
    value.forEach((item, index) => {
      const isLast = index === value.length - 1;
      const prefix = isLast ? "└── " : "├── ";
      const childPrefix = isLast ? "    " : "│   ";
      const childLines = buildSimpleTree(
        item,
        options,
        depth + 1,
        nodeCountRef
      );
      lines.push(prefix + childLines[0]);
      childLines.slice(1).forEach((line) => lines.push(childPrefix + line));
    });
    return lines;
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      return ["{} (empty)"];
    }

    const lines: string[] = [`Object{${entries.length}}`];
    entries.forEach(([key, val], index) => {
      const isLast = index === entries.length - 1;
      const prefix = isLast ? "└── " : "├── ";
      const childPrefix = isLast ? "    " : "│   ";

      if (
        val !== null &&
        typeof val === "object" &&
        (Array.isArray(val) ? val.length > 0 : Object.keys(val).length > 0)
      ) {
        const childLines = buildSimpleTree(
          val,
          options,
          depth + 1,
          nodeCountRef
        );
        lines.push(`${prefix}${key}: ${childLines[0]}`);
        childLines.slice(1).forEach((line) => lines.push(childPrefix + line));
      } else {
        const typeStr = options.showTypes
          ? ` (${val === null ? "null" : typeof val})`
          : "";
        const valStr = options.showValues ? JSON.stringify(val) : "";
        lines.push(`${prefix}${key}: ${valStr}${typeStr}`);
        nodeCountRef.count++;
      }
    });
    return lines;
  }

  // Primitive
  const typeStr = options.showTypes ? ` (${typeof value})` : "";
  return [
    options.showValues ? `${JSON.stringify(value)}${typeStr}` : typeof value,
  ];
}

/**
 * Displays JSON as a tree structure.
 */
function execute(input: Input, options?: Options): Output {
  const opts = {
    maxDepth: options?.maxDepth ?? 10,
    showTypes: options?.showTypes ?? true,
    showValues: options?.showValues ?? true,
    indent: options?.indent ?? "  ",
  };

  let parsed: unknown;
  try {
    parsed = JSON.parse(input.input);
  } catch (err) {
    throw createToolError({
      code: JSON_PARSE_ERROR,
      message: `Invalid JSON: ${err instanceof Error ? err.message : "Parse error"}`,
    });
  }

  const nodeCountRef = { count: 0 };
  const lines = buildSimpleTree(parsed, opts, 0, nodeCountRef);
  const output = lines.join("\n");

  return {
    output,
    nodeCount: nodeCountRef.count,
  };
}

/**
 * JSON Tree Viewer tool.
 * Displays JSON as a hierarchical tree structure.
 */
export const jsonTreeViewer = defineTool({
  meta: {
    id: "json/tree-viewer",
    name: "JSON Tree Viewer",
    description:
      "Free online JSON tree viewer — display JSON as a hierarchical tree with types and values instantly in your browser. No data is stored. Configurable depth, type labels, and indentation.",
    category: "json",
    subgroup: "Core",
    tier: ToolTier.CLIENT,
    keywords: ["json", "tree", "view", "hierarchy", "structure"],
    examples: [
      {
        title: "Nested Object",
        description: "View a nested JSON object as an indented tree",
        input: '{"user":{"name":"Alice","roles":["admin","editor"]}}',
        output:
          'Object{1}\n└── user: Object{2}\n    ├── name: "Alice" (string)\n    └── roles: Array[2]\n        ├── "admin" (string)\n        └── "editor" (string)',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
