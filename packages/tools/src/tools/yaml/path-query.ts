import { z } from "zod";
import yaml from "js-yaml";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { YAML_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("YAML string to query"),
});

const optionsSchema = z.object({
  query: z
    .string()
    .default("$")
    .describe("Path query (e.g., 'user.name' or 'items[0].id')"),
});

const outputSchema = z.object({
  output: z.string().describe("Query result as YAML string"),
  found: z.boolean().describe("Whether the path was found"),
  type: z.string().describe("Type of the result value"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

function resolvePath(
  obj: unknown,
  path: string
): { value: unknown; found: boolean } {
  if (!path || path === "$") {
    return { value: obj, found: true };
  }

  const cleanPath = path.startsWith("$.")
    ? path.slice(2)
    : path.startsWith("$")
      ? path.slice(1)
      : path;

  if (!cleanPath) {
    return { value: obj, found: true };
  }

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
      if (!(segment in current)) {
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
 * Queries YAML using path notation.
 */
function execute(input: Input, options?: Options): Output {
  const query = options?.query ?? "$";

  let parsed: unknown;
  try {
    parsed = yaml.load(input.input);
  } catch (err) {
    throw createToolError({
      code: YAML_PARSE_ERROR,
      message: `Invalid YAML: ${err instanceof Error ? err.message : "Parse error"}`,
    });
  }

  const { value, found } = resolvePath(parsed, query);

  if (!found) {
    return {
      output: "",
      found: false,
      type: "undefined",
    };
  }

  const output = yaml.dump(value, { noRefs: true });

  return {
    output,
    found: true,
    type: getType(value),
  };
}

/**
 * YAML Path Query tool.
 * Extracts values from YAML using path notation.
 */
export const yamlPathQuery = defineTool({
  meta: {
    id: "yaml/path-query",
    name: "YAML Path Query",
    description:
      "Free online YAML path query tool — extract values from YAML using dot notation instantly in your browser. No data is stored. Supports nested keys, array indexes, quoted keys, and JSONPath-style $ prefix.",
    category: "yaml",
    tier: ToolTier.CLIENT,
    keywords: [
      "yaml",
      "path",
      "query",
      "extract",
      "jq",
      "jsonpath",
      "dot-notation",
      "nested",
      "lookup",
    ],
    examples: [
      {
        title: "Extract nested address field",
        description:
          "Query a deeply nested value from a YAML document — set the query option to 'user.address.city'",
        input:
          "user:\n  name: Alice\n  address:\n    city: Portland\n    state: OR\n  roles:\n    - admin\n    - editor",
        output: "Portland\n",
        options: { query: "user.address.city" },
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
