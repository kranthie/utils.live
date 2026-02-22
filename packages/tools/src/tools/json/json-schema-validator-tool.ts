import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input1: z.string().describe("JSON data to validate"),
  input2: z.string().describe("JSON Schema to validate against"),
});

const outputSchema = z.object({
  original: z.string().describe("Validation result"),
  modified: z.string().describe("Schema used"),
});

function validateValue(
  value: unknown,
  schema: Record<string, unknown>,
  path: string
): string[] {
  const errors: string[] = [];
  const type = schema.type as string | undefined;

  if (schema.enum) {
    if (!Array.isArray(schema.enum) || !schema.enum.includes(value)) {
      errors.push(
        `${path}: value must be one of ${JSON.stringify(schema.enum)}`
      );
    }
    return errors;
  }

  if (schema.const !== undefined) {
    if (value !== schema.const) {
      errors.push(`${path}: value must be ${JSON.stringify(schema.const)}`);
    }
    return errors;
  }

  if (type) {
    const actualType =
      value === null ? "null" : Array.isArray(value) ? "array" : typeof value;
    const validTypes = Array.isArray(type) ? type : [type];

    const typeValid = validTypes.some((t) => {
      if (t === "integer")
        return typeof value === "number" && Number.isInteger(value);
      return actualType === t;
    });

    if (!typeValid) {
      errors.push(`${path}: expected type "${type}" but got "${actualType}"`);
      return errors;
    }
  }

  if (typeof value === "string") {
    if (
      schema.minLength !== undefined &&
      value.length < (schema.minLength as number)
    ) {
      errors.push(
        `${path}: string length ${value.length} is less than minimum ${schema.minLength as number}`
      );
    }
    if (
      schema.maxLength !== undefined &&
      value.length > (schema.maxLength as number)
    ) {
      errors.push(
        `${path}: string length ${value.length} exceeds maximum ${schema.maxLength as number}`
      );
    }
    if (schema.pattern) {
      try {
        if (!new RegExp(schema.pattern as string).test(value)) {
          errors.push(
            `${path}: string does not match pattern "${schema.pattern as string}"`
          );
        }
      } catch {
        /* ignore invalid regex */
      }
    }
  }

  if (typeof value === "number") {
    if (schema.minimum !== undefined && value < (schema.minimum as number)) {
      errors.push(
        `${path}: ${value} is less than minimum ${schema.minimum as number}`
      );
    }
    if (schema.maximum !== undefined && value > (schema.maximum as number)) {
      errors.push(
        `${path}: ${value} exceeds maximum ${schema.maximum as number}`
      );
    }
    if (
      schema.exclusiveMinimum !== undefined &&
      value <= (schema.exclusiveMinimum as number)
    ) {
      errors.push(
        `${path}: ${value} must be greater than ${schema.exclusiveMinimum as number}`
      );
    }
    if (
      schema.exclusiveMaximum !== undefined &&
      value >= (schema.exclusiveMaximum as number)
    ) {
      errors.push(
        `${path}: ${value} must be less than ${schema.exclusiveMaximum as number}`
      );
    }
    if (
      schema.multipleOf !== undefined &&
      value % (schema.multipleOf as number) !== 0
    ) {
      errors.push(
        `${path}: ${value} is not a multiple of ${schema.multipleOf as number}`
      );
    }
  }

  if (Array.isArray(value)) {
    if (
      schema.minItems !== undefined &&
      value.length < (schema.minItems as number)
    ) {
      errors.push(
        `${path}: array has ${value.length} items, minimum is ${schema.minItems as number}`
      );
    }
    if (
      schema.maxItems !== undefined &&
      value.length > (schema.maxItems as number)
    ) {
      errors.push(
        `${path}: array has ${value.length} items, maximum is ${schema.maxItems as number}`
      );
    }
    if (schema.items && typeof schema.items === "object") {
      for (let i = 0; i < value.length; i++) {
        errors.push(
          ...validateValue(
            value[i],
            schema.items as Record<string, unknown>,
            `${path}[${i}]`
          )
        );
      }
    }
  }

  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    const properties = schema.properties as
      | Record<string, Record<string, unknown>>
      | undefined;
    const required = schema.required as string[] | undefined;

    if (required) {
      for (const req of required) {
        if (!(req in obj)) {
          errors.push(`${path}: missing required property "${req}"`);
        }
      }
    }

    if (properties) {
      for (const [key, val] of Object.entries(obj)) {
        if (properties[key]) {
          errors.push(...validateValue(val, properties[key], `${path}.${key}`));
        } else if (schema.additionalProperties === false) {
          errors.push(`${path}: additional property "${key}" is not allowed`);
        }
      }
    }
  }

  return errors;
}

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  const dataText = input.input1.trim();
  const schemaText = input.input2.trim();
  if (!dataText) throw new Error("JSON data cannot be empty");
  if (!schemaText) throw new Error("JSON Schema cannot be empty");

  let data: unknown;
  let schema: Record<string, unknown>;

  try {
    data = JSON.parse(dataText);
  } catch (e) {
    throw new Error(
      `Invalid JSON data: ${e instanceof Error ? e.message : "Parse error"}`
    );
  }

  try {
    schema = JSON.parse(schemaText) as Record<string, unknown>;
  } catch (e) {
    throw new Error(
      `Invalid JSON Schema: ${e instanceof Error ? e.message : "Parse error"}`
    );
  }

  const errors = validateValue(data, schema, "$");

  let result: string;
  if (errors.length === 0) {
    result = "VALID\n\nThe JSON data is valid against the provided schema.";
  } else {
    result = `INVALID\n\n${errors.length} validation error(s) found:\n\n${errors.map((e, i) => `${i + 1}. ${e}`).join("\n")}`;
  }

  return { original: result, modified: JSON.stringify(schema, null, 2) };
}

export const jsonSchemaValidatorTool = defineTool({
  meta: {
    id: "json/json-schema-validator-tool",
    name: "JSON Schema Validator",
    description:
      "Free online JSON data validator — validate JSON data against a JSON Schema with side-by-side view instantly in your browser. No data is stored. Checks types, required fields, patterns, and constraints.",
    category: "json",
    subgroup: "JSON Schema",
    tier: ToolTier.CLIENT,
    keywords: ["json", "schema", "validate", "check", "verify"],
    ui: { inputLanguage: "json", outputLanguage: "json" },
    examples: [
      {
        title: "Valid User Data",
        description:
          "Validate a user object against a schema with type constraints",
        input: {
          input1: '{"name": "Alice", "age": 30}',
          input2:
            '{"type": "object", "properties": {"name": {"type": "string"}, "age": {"type": "integer", "minimum": 0}}, "required": ["name"]}',
        },
        output:
          'VALID\n\nThe JSON data is valid against the provided schema.\n{\n  "type": "object",\n  "properties": {\n    "name": {\n      "type": "string"\n    },\n    "age": {\n      "type": "integer",\n      "minimum": 0\n    }\n  },\n  "required": [\n    "name"\n  ]\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
