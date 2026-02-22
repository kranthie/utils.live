import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { JSON_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("Flattened JSON string to unflatten"),
});

const outputSchema = z.object({
  output: z.string().describe("Unflattened nested JSON string"),
});

const optionsSchema = z.object({
  delimiter: z
    .string()
    .default(".")
    .describe("Delimiter used in flattened keys"),
  indent: z
    .number()
    .int()
    .min(0)
    .max(8)
    .default(2)
    .describe("Indentation spaces"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

function unflattenObject(
  obj: Record<string, unknown>,
  delimiter: string
): unknown {
  const result: Record<string, unknown> = {};

  for (const [flatKey, value] of Object.entries(obj)) {
    const keys = parseKey(flatKey, delimiter);
    setNestedValue(result, keys, value);
  }

  return result;
}

function parseKey(flatKey: string, delimiter: string): (string | number)[] {
  const keys: (string | number)[] = [];
  let current = "";
  let i = 0;

  while (i < flatKey.length) {
    if (flatKey[i] === "[") {
      // Handle array index
      if (current) {
        keys.push(current);
        current = "";
      }
      const end = flatKey.indexOf("]", i);
      if (end === -1) {
        throw new Error(`Invalid key format: unclosed bracket in "${flatKey}"`);
      }
      const indexStr = flatKey.slice(i + 1, end);
      const index = parseInt(indexStr, 10);
      if (isNaN(index)) {
        // It's a string key in brackets
        keys.push(indexStr);
      } else {
        keys.push(index);
      }
      i = end + 1;
      // Skip delimiter after bracket
      if (flatKey[i] === delimiter) {
        i++;
      }
    } else if (flatKey.slice(i, i + delimiter.length) === delimiter) {
      if (current) {
        keys.push(current);
        current = "";
      }
      i += delimiter.length;
    } else {
      current += flatKey[i];
      i++;
    }
  }

  if (current) {
    keys.push(current);
  }

  return keys;
}

function setNestedValue(
  obj: Record<string, unknown>,
  keys: (string | number)[],
  value: unknown
): void {
  let current: Record<string, unknown> | unknown[] = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const nextKey = keys[i + 1];
    if (key === undefined) continue;
    const nextIsArray = typeof nextKey === "number";

    if (typeof key === "number") {
      // Current level is array
      const arr = current as unknown[];
      if (arr[key] === undefined) {
        arr[key] = nextIsArray ? [] : {};
      }
      current = arr[key] as Record<string, unknown> | unknown[];
    } else {
      // Current level is object
      const record = current as Record<string, unknown>;
      if (record[key] === undefined) {
        record[key] = nextIsArray ? [] : {};
      }
      current = record[key] as Record<string, unknown> | unknown[];
    }
  }

  const lastKey = keys[keys.length - 1];
  if (lastKey === undefined) return;
  if (typeof lastKey === "number") {
    (current as unknown[])[lastKey] = value;
  } else {
    (current as Record<string, unknown>)[lastKey] = value;
  }
}

/**
 * Unflattens a flat JSON object into nested structure.
 */
function execute(input: Input, options?: Options): Output {
  const delimiter = options?.delimiter ?? ".";
  const indent = options?.indent ?? 2;

  try {
    const parsed: unknown = JSON.parse(input.input);

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      throw new Error("Input must be a flat JSON object");
    }

    const unflattened = unflattenObject(
      parsed as Record<string, unknown>,
      delimiter
    );
    const output = JSON.stringify(unflattened, null, indent);

    return { output };
  } catch (err) {
    throw createToolError({
      code: JSON_PARSE_ERROR,
      message: `${err instanceof Error ? err.message : "Parse error"}`,
    });
  }
}

/**
 * JSON Unflatten tool.
 * Converts a flat JSON object into nested structure.
 */
export const jsonUnflatten = defineTool({
  meta: {
    id: "json/unflatten",
    name: "JSON Unflatten",
    description:
      "Free online JSON unflatten tool — reconstruct nested objects from flat dot-notation keys instantly in your browser. No data is stored. Supports custom delimiters and array index notation.",
    category: "json",
    subgroup: "Core",
    tier: ToolTier.CLIENT,
    keywords: ["json", "unflatten", "nested", "normalize", "reconstruct"],
    examples: [
      {
        title: "Dot Notation to Nested",
        description: "Reconstruct nested objects from dot-notation keys",
        input:
          '{"user.name": "Alice", "user.address.city": "Portland", "active": true}',
        output:
          '{\n  "user": {\n    "name": "Alice",\n    "address": {\n      "city": "Portland"\n    }\n  },\n  "active": true\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
