import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { JSON_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("JSON string to analyze"),
});

const outputSchema = z.object({
  totalSize: z.number().describe("Total size in bytes"),
  minifiedSize: z.number().describe("Minified size in bytes"),
  keyCount: z.number().describe("Total number of keys"),
  valueCount: z.number().describe("Total number of values"),
  depth: z.number().describe("Maximum nesting depth"),
  arrayCount: z.number().describe("Number of arrays"),
  objectCount: z.number().describe("Number of objects"),
  stringCount: z.number().describe("Number of string values"),
  numberCount: z.number().describe("Number of number values"),
  booleanCount: z.number().describe("Number of boolean values"),
  nullCount: z.number().describe("Number of null values"),
  largestKeys: z
    .array(
      z.object({
        path: z.string(),
        size: z.number(),
      })
    )
    .describe("Top 5 largest keys by value size"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

interface AnalysisState {
  keyCount: number;
  valueCount: number;
  maxDepth: number;
  arrayCount: number;
  objectCount: number;
  stringCount: number;
  numberCount: number;
  booleanCount: number;
  nullCount: number;
  keySizes: Array<{ path: string; size: number }>;
}

/**
 * Recursively analyzes JSON structure.
 */
function analyze(
  value: unknown,
  state: AnalysisState,
  path: string,
  depth: number
): void {
  state.maxDepth = Math.max(state.maxDepth, depth);

  if (value === null) {
    state.nullCount++;
    state.valueCount++;
    return;
  }

  if (Array.isArray(value)) {
    state.arrayCount++;
    state.valueCount++;
    value.forEach((item, index) => {
      analyze(item, state, `${path}[${index}]`, depth + 1);
    });
    return;
  }

  if (typeof value === "object") {
    state.objectCount++;
    state.valueCount++;
    for (const [key, val] of Object.entries(value)) {
      state.keyCount++;
      const keyPath = path ? `${path}.${key}` : key;
      const size = JSON.stringify(val).length;
      state.keySizes.push({ path: keyPath, size });
      analyze(val, state, keyPath, depth + 1);
    }
    return;
  }

  state.valueCount++;
  if (typeof value === "string") {
    state.stringCount++;
  } else if (typeof value === "number") {
    state.numberCount++;
  } else if (typeof value === "boolean") {
    state.booleanCount++;
  }
}

/**
 * Analyzes JSON size and structure.
 */
function execute(input: Input): Output {
  const totalSize = new TextEncoder().encode(input.input).length;

  let parsed: unknown;
  try {
    parsed = JSON.parse(input.input);
  } catch (err) {
    throw createToolError({
      code: JSON_PARSE_ERROR,
      message: `Invalid JSON: ${err instanceof Error ? err.message : "Parse error"}`,
    });
  }

  const minifiedSize = new TextEncoder().encode(JSON.stringify(parsed)).length;

  const state: AnalysisState = {
    keyCount: 0,
    valueCount: 0,
    maxDepth: 0,
    arrayCount: 0,
    objectCount: 0,
    stringCount: 0,
    numberCount: 0,
    booleanCount: 0,
    nullCount: 0,
    keySizes: [],
  };

  analyze(parsed, state, "", 0);

  // Get top 5 largest keys
  const largestKeys = state.keySizes
    .sort((a, b) => b.size - a.size)
    .slice(0, 5);

  return {
    totalSize,
    minifiedSize,
    keyCount: state.keyCount,
    valueCount: state.valueCount,
    depth: state.maxDepth,
    arrayCount: state.arrayCount,
    objectCount: state.objectCount,
    stringCount: state.stringCount,
    numberCount: state.numberCount,
    booleanCount: state.booleanCount,
    nullCount: state.nullCount,
    largestKeys,
  };
}

/**
 * JSON Size Analyzer tool.
 * Analyzes JSON structure and size metrics.
 */
export const jsonSizeAnalyzer = defineTool({
  meta: {
    id: "json/size-analyzer",
    name: "JSON Size Analyzer",
    description:
      "Free online JSON size analyzer — measure JSON structure, nesting depth, and value type distribution instantly in your browser. No data is stored. Shows byte sizes, key counts, and largest entries.",
    category: "json",
    subgroup: "Core",
    tier: ToolTier.CLIENT,
    keywords: ["json", "size", "analyze", "metrics", "structure"],
    examples: [
      {
        title: "Analyze API Response",
        description: "Get size and structure metrics for a JSON API response",
        input:
          '{\n  "users": [\n    {"id": 1, "name": "Alice", "active": true},\n    {"id": 2, "name": "Bob", "active": false}\n  ],\n  "total": 2\n}',
        output:
          '{\n  "totalSize": 128,\n  "minifiedSize": 96,\n  "keyCount": 8,\n  "valueCount": 11,\n  "depth": 3,\n  "arrayCount": 1,\n  "objectCount": 3,\n  "stringCount": 2,\n  "numberCount": 3,\n  "booleanCount": 2,\n  "nullCount": 0,\n  "largestKeys": [\n    {\n      "path": "users",\n      "size": 76\n    },\n    {\n      "path": "users[0].name",\n      "size": 7\n    },\n    {\n      "path": "users[1].name",\n      "size": 5\n    },\n    {\n      "path": "users[1].active",\n      "size": 5\n    },\n    {\n      "path": "users[0].active",\n      "size": 4\n    }\n  ]\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
