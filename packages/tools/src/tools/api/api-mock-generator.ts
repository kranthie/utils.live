import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z
    .string()
    .describe("JSON Schema or sample JSON to generate mock data from"),
});

const optionsSchema = z.object({
  count: z
    .number()
    .min(1)
    .max(100)
    .default(3)
    .describe("Number of mock objects to generate"),
  wrapInArray: z
    .boolean()
    .default(true)
    .describe("Wrap output in array when count > 1"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated mock JSON data"),
});

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomString(length: number = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < length; i++)
    result += chars[randomInt(0, chars.length - 1)];
  return result;
}

function randomEmail(): string {
  return `${randomString(6)}@${randomString(5)}.com`;
}

function randomDate(): string {
  const y = randomInt(2020, 2025);
  const m = String(randomInt(1, 12)).padStart(2, "0");
  const d = String(randomInt(1, 28)).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function generateFromSchema(schema: Record<string, unknown>): unknown {
  const type = schema.type as string;

  if (schema.enum && Array.isArray(schema.enum)) {
    return schema.enum[randomInt(0, schema.enum.length - 1)];
  }

  switch (type) {
    case "string": {
      const format = schema.format as string | undefined;
      if (format === "email") return randomEmail();
      if (format === "date" || format === "date-time") return randomDate();
      if (format === "uri" || format === "url")
        return `https://${randomString(8)}.com`;
      if (format === "uuid")
        return `${randomString(8)}-${randomString(4)}-${randomString(4)}-${randomString(4)}-${randomString(12)}`;
      const minLen = (schema.minLength as number) ?? 3;
      const maxLen = (schema.maxLength as number) ?? 12;
      return randomString(randomInt(minLen, Math.min(maxLen, 20)));
    }
    case "number":
    case "integer": {
      const min = (schema.minimum as number) ?? 0;
      const max = (schema.maximum as number) ?? 1000;
      const val = randomInt(min, max);
      return type === "number" ? val + Math.random() * 0.99 : val;
    }
    case "boolean":
      return Math.random() > 0.5;
    case "array": {
      const items = schema.items as Record<string, unknown> | undefined;
      const count = randomInt(1, 3);
      if (items)
        return Array.from({ length: count }, () => generateFromSchema(items));
      return Array.from({ length: count }, () => randomInt(1, 100));
    }
    case "object": {
      const props = schema.properties as
        | Record<string, Record<string, unknown>>
        | undefined;
      if (props) {
        const obj: Record<string, unknown> = {};
        for (const [key, propSchema] of Object.entries(props)) {
          obj[key] = generateFromSchema(propSchema);
        }
        return obj;
      }
      return {};
    }
    default:
      return randomString();
  }
}

function inferSchemaFromSample(sample: unknown): Record<string, unknown> {
  if (sample === null) return { type: "string" };
  if (typeof sample === "string") {
    if (sample.includes("@")) return { type: "string", format: "email" };
    if (/^\d{4}-\d{2}-\d{2}/.test(sample))
      return { type: "string", format: "date" };
    if (sample.startsWith("http")) return { type: "string", format: "uri" };
    return { type: "string" };
  }
  if (typeof sample === "number")
    return Number.isInteger(sample) ? { type: "integer" } : { type: "number" };
  if (typeof sample === "boolean") return { type: "boolean" };
  if (Array.isArray(sample)) {
    return {
      type: "array",
      items:
        sample.length > 0
          ? inferSchemaFromSample(sample[0])
          : { type: "string" },
    };
  }
  if (typeof sample === "object") {
    const properties: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(
      sample as Record<string, unknown>
    )) {
      properties[key] = inferSchemaFromSample(value);
    }
    return { type: "object", properties };
  }
  return { type: "string" };
}

function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): z.infer<typeof outputSchema> {
  const text = input.input.trim();
  if (!text) throw new Error("Input cannot be empty");
  const count = options?.count ?? 3;
  const wrapInArray = options?.wrapInArray ?? true;

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(
      "Input must be valid JSON (either a JSON Schema or sample data)"
    );
  }

  // Determine if input is a JSON Schema or sample data
  let schema: Record<string, unknown>;
  if (
    typeof parsed === "object" &&
    parsed !== null &&
    "type" in (parsed as Record<string, unknown>)
  ) {
    schema = parsed as Record<string, unknown>;
  } else {
    // Infer schema from sample
    if (Array.isArray(parsed) && parsed.length > 0) {
      schema = inferSchemaFromSample(parsed[0]);
    } else {
      schema = inferSchemaFromSample(parsed);
    }
  }

  const items = Array.from({ length: count }, () => generateFromSchema(schema));

  let output: string;
  if (count === 1 && !wrapInArray) {
    output = JSON.stringify(items[0], null, 2);
  } else {
    output = JSON.stringify(wrapInArray ? items : items[0], null, 2);
  }

  return { output };
}

export const apiMockGenerator = defineTool({
  meta: {
    id: "api/api-mock-generator",
    name: "API Mock Data Generator",
    description:
      "Free online API mock data generator — create realistic mock JSON data from JSON Schema or sample data instantly in your browser. No data is stored. Infers types from sample data and generates multiple records with randomized values.",
    category: "api",
    subgroup: "HTTP Tools",
    tier: ToolTier.CLIENT,
    keywords: [
      "mock",
      "data",
      "api",
      "json",
      "schema",
      "generate",
      "fake",
      "test",
      "sample",
      "fixture",
    ],
    ui: { outputLanguage: "json" },
    examples: [
      {
        title: "Mock User Data from Schema",
        description: "Generate mock user objects from a JSON Schema definition",
        input:
          '{"type":"object","properties":{"id":{"type":"integer"},"name":{"type":"string"},"email":{"type":"string","format":"email"},"active":{"type":"boolean"}}}',
        output:
          "Output varies — generates randomized mock data matching the schema structure with realistic values for each field type.",
        options: { count: 1, wrapInArray: false },
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
