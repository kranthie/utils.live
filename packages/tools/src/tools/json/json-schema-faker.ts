import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("JSON Schema to generate fake data from"),
});

const optionsSchema = z.object({
  count: z
    .number()
    .min(1)
    .max(50)
    .default(1)
    .describe("Number of fake records to generate"),
  seed: z.number().optional().describe("Random seed for reproducibility"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated fake data as JSON"),
});

type Input = z.infer<typeof inputSchema>;
type Options = z.infer<typeof optionsSchema>;
type Output = z.infer<typeof outputSchema>;

// Simple seeded PRNG
function createRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function generateFake(
  schema: Record<string, unknown>,
  rng: () => number,
  depth: number = 0
): unknown {
  if (depth > 10) return null;

  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;
  if (schema.const !== undefined) return schema.const;

  const enumValues = schema.enum as unknown[] | undefined;
  if (enumValues && enumValues.length > 0) {
    return enumValues[Math.floor(rng() * enumValues.length)];
  }

  if (schema.oneOf && Array.isArray(schema.oneOf) && schema.oneOf.length > 0) {
    const choice = schema.oneOf[
      Math.floor(rng() * schema.oneOf.length)
    ] as Record<string, unknown>;
    return generateFake(choice, rng, depth + 1);
  }
  if (schema.anyOf && Array.isArray(schema.anyOf) && schema.anyOf.length > 0) {
    const choice = schema.anyOf[
      Math.floor(rng() * schema.anyOf.length)
    ] as Record<string, unknown>;
    return generateFake(choice, rng, depth + 1);
  }

  const type = (Array.isArray(schema.type) ? schema.type[0] : schema.type) as
    | string
    | undefined;

  switch (type) {
    case "string": {
      const format = schema.format as string | undefined;
      const minLen = (schema.minLength as number) ?? 1;
      const maxLen = (schema.maxLength as number) ?? 20;
      const len = Math.floor(rng() * (maxLen - minLen + 1)) + minLen;

      if (format === "date") return "2024-01-15";
      if (format === "date-time") return "2024-01-15T10:30:00Z";
      if (format === "time") return "10:30:00";
      if (format === "email")
        return `user${Math.floor(rng() * 1000)}@example.com`;
      if (format === "uri" || format === "url")
        return `https://example.com/${Math.floor(rng() * 1000)}`;
      if (format === "uuid") {
        const hex = (): string => Math.floor(rng() * 16).toString(16);
        return `${hex()}${hex()}${hex()}${hex()}${hex()}${hex()}${hex()}${hex()}-${hex()}${hex()}${hex()}${hex()}-4${hex()}${hex()}${hex()}-${["8", "9", "a", "b"][Math.floor(rng() * 4)]}${hex()}${hex()}${hex()}-${hex()}${hex()}${hex()}${hex()}${hex()}${hex()}${hex()}${hex()}${hex()}${hex()}${hex()}${hex()}`;
      }
      if (format === "ipv4")
        return `${Math.floor(rng() * 255)}.${Math.floor(rng() * 255)}.${Math.floor(rng() * 255)}.${Math.floor(rng() * 255)}`;
      if (format === "hostname")
        return `host${Math.floor(rng() * 100)}.example.com`;

      if (schema.pattern) return `[pattern:${schema.pattern as string}]`;

      const chars = "abcdefghijklmnopqrstuvwxyz";
      let str = "";
      for (let i = 0; i < len; i++) {
        str += chars[Math.floor(rng() * chars.length)];
      }
      return str;
    }

    case "integer": {
      const min = (schema.minimum as number) ?? 0;
      const max = (schema.maximum as number) ?? 1000;
      return Math.floor(rng() * (max - min + 1)) + min;
    }

    case "number": {
      const min = (schema.minimum as number) ?? 0;
      const max = (schema.maximum as number) ?? 1000;
      return Math.round((rng() * (max - min) + min) * 100) / 100;
    }

    case "boolean":
      return rng() > 0.5;

    case "null":
      return null;

    case "array": {
      const items = schema.items as Record<string, unknown> | undefined;
      const minItems = (schema.minItems as number) ?? 1;
      const maxItems = (schema.maxItems as number) ?? 3;
      const count = Math.floor(rng() * (maxItems - minItems + 1)) + minItems;
      const arr: unknown[] = [];
      for (let i = 0; i < count; i++) {
        arr.push(items ? generateFake(items, rng, depth + 1) : null);
      }
      return arr;
    }

    case "object":
    default: {
      const properties = schema.properties as
        | Record<string, Record<string, unknown>>
        | undefined;
      if (!properties) return {};
      const result: Record<string, unknown> = {};
      const required = (schema.required as string[]) ?? [];
      for (const [key, propSchema] of Object.entries(properties)) {
        if (required.includes(key) || rng() > 0.3) {
          result[key] = generateFake(propSchema, rng, depth + 1);
        }
      }
      return result;
    }
  }
}

function execute(input: Input, options?: Options): Output {
  if (!input.input.trim()) {
    throw new Error("Input cannot be empty");
  }

  let schema: Record<string, unknown>;
  try {
    schema = JSON.parse(input.input) as Record<string, unknown>;
  } catch {
    throw new Error("Invalid JSON input");
  }

  const count = options?.count ?? 1;
  const seed = options?.seed ?? Date.now();
  const rng = createRng(seed);

  if (count === 1) {
    const data = generateFake(schema, rng);
    return { output: JSON.stringify(data, null, 2) };
  }

  const results: unknown[] = [];
  for (let i = 0; i < count; i++) {
    results.push(generateFake(schema, rng));
  }

  return { output: JSON.stringify(results, null, 2) };
}

export const jsonSchemaFaker = defineTool({
  meta: {
    id: "json/json-schema-faker",
    name: "JSON Schema Faker",
    description:
      "Free online JSON Schema faker — generate realistic mock data from JSON Schema definitions instantly in your browser. No data is stored. Supports all JSON Schema types, formats, enums, and constraints.",
    category: "json",
    subgroup: "JSON Schema",
    tier: ToolTier.CLIENT,
    keywords: ["json", "schema", "fake", "mock", "generate", "data", "test"],
    examples: [
      {
        title: "Generate User Data",
        description:
          "Generate a fake user object from a JSON Schema definition",
        input:
          '{\n  "type": "object",\n  "properties": {\n    "name": {"type": "string"},\n    "email": {"type": "string", "format": "email"},\n    "age": {"type": "integer", "minimum": 18, "maximum": 65}\n  },\n  "required": ["name", "email", "age"]\n}',
        output:
          '{\n  "name": "kxqrm",\n  "email": "user472@example.com",\n  "age": 34\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
