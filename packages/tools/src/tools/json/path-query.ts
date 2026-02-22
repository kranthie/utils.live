import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import {
  JSON_PARSE_ERROR,
  JSON_INVALID_PATH,
  JSON_PATH_NOT_FOUND,
} from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("JSON string to query"),
});

const optionsSchema = z.object({
  query: z
    .string()
    .default("$")
    .describe("JSON path query (e.g., 'user.name' or 'items[0].id')"),
});

const outputSchema = z.object({
  output: z.string().describe("Query result as JSON string"),
  found: z.boolean().describe("Whether the path was found"),
  type: z.string().describe("Type of the result value"),
});

type Input = z.infer<typeof inputSchema>;
type Options = z.infer<typeof optionsSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Resolves a path query against a JSON object.
 * Supports dot notation and array indices.
 */
function resolvePath(
  obj: unknown,
  path: string
): { value: unknown; found: boolean } {
  if (!path || path === "$") {
    return { value: obj, found: true };
  }

  // Remove leading $ if present
  const cleanPath = path.startsWith("$.")
    ? path.slice(2)
    : path.startsWith("$")
      ? path.slice(1)
      : path;

  if (!cleanPath) {
    return { value: obj, found: true };
  }

  // Split path into segments, handling both dot notation and bracket notation
  const segments: (string | number)[] = [];
  const regex = /([^.[\]]+)|\[(\d+|'[^']*'|"[^"]*")]/g;
  let match;

  while ((match = regex.exec(cleanPath)) !== null) {
    if (match[1] !== undefined) {
      segments.push(match[1]);
    } else if (match[2] !== undefined) {
      const idx = match[2];
      if (/^\d+$/.test(idx)) {
        segments.push(parseInt(idx, 10));
      } else {
        // Remove quotes from string keys
        segments.push(idx.slice(1, -1));
      }
    }
  }

  let current: unknown = obj;
  for (const segment of segments) {
    if (current === null || current === undefined) {
      return { value: undefined, found: false };
    }

    if (typeof segment === "number") {
      if (!Array.isArray(current)) {
        return { value: undefined, found: false };
      }
      if (segment < 0 || segment >= current.length) {
        return { value: undefined, found: false };
      }
      current = current[segment];
    } else {
      if (typeof current !== "object" || current === null) {
        return { value: undefined, found: false };
      }
      // Block prototype chain access to prevent information leakage
      if (
        segment === "__proto__" ||
        segment === "constructor" ||
        segment === "prototype"
      ) {
        return { value: undefined, found: false };
      }
      // Use hasOwn instead of `in` to avoid traversing the prototype chain
      if (!Object.prototype.hasOwnProperty.call(current, segment)) {
        return { value: undefined, found: false };
      }
      current = (current as Record<string, unknown>)[segment];
    }
  }

  return { value: current, found: true };
}

function getType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

/**
 * Queries JSON using path notation.
 */
function execute(input: Input, options?: Options): Output {
  const query = options?.query ?? "$";

  let parsed: unknown;
  try {
    parsed = JSON.parse(input.input);
  } catch (err) {
    throw createToolError({
      code: JSON_PARSE_ERROR,
      message: `Invalid JSON: ${err instanceof Error ? err.message : "Parse error"}`,
    });
  }

  if (!query.trim()) {
    throw createToolError({
      code: JSON_INVALID_PATH,
      message: "Query path cannot be empty",
    });
  }

  const { value, found } = resolvePath(parsed, query);

  if (!found) {
    throw createToolError({
      code: JSON_PATH_NOT_FOUND,
      message: `Path not found: ${query}`,
    });
  }

  return {
    output: JSON.stringify(value, null, 2),
    found: true,
    type: getType(value),
  };
}

/**
 * JSON Path Query tool.
 * Extracts values from JSON using path notation.
 */
export const jsonPathQuery = defineTool({
  meta: {
    id: "json/path-query",
    name: "JSON Path Query",
    description:
      "Free online JSON path query tool — extract values from JSON using dot notation and bracket syntax instantly in your browser. No data is stored. Supports nested objects, arrays, and string keys.",
    category: "json",
    subgroup: "Core",
    tier: ToolTier.CLIENT,
    keywords: ["json", "path", "query", "extract", "jq", "jsonpath"],
    examples: [
      {
        title: "Nested Property",
        description: "Extract a nested value using dot notation",
        input:
          '{"user":{"name":"Alice","address":{"city":"Portland","zip":"97201"}}}',
        options: { query: "user.address.city" },
        output: '"Portland"',
      },
      {
        title: "Array Element",
        description: "Access an array element by index",
        input: '{"items":[{"id":1,"name":"Widget"},{"id":2,"name":"Gadget"}]}',
        options: { query: "items[1]" },
        output: '{\n  "id": 2,\n  "name": "Gadget"\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
