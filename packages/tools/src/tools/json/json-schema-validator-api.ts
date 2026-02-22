import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("JSON Schema document to validate"),
});

const outputSchema = z.object({
  valid: z.boolean().describe("Whether the schema is valid"),
  version: z.string().optional().describe("Detected JSON Schema version"),
  errors: z.array(z.string()).describe("Validation errors"),
  warnings: z.array(z.string()).describe("Validation warnings"),
  stats: z.object({
    properties: z.number(),
    required: z.number(),
    types: z.array(z.string()),
  }),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

const VALID_TYPES = [
  "string",
  "number",
  "integer",
  "boolean",
  "object",
  "array",
  "null",
];
const VALID_FORMATS = [
  "date-time",
  "date",
  "time",
  "email",
  "idn-email",
  "hostname",
  "idn-hostname",
  "ipv4",
  "ipv6",
  "uri",
  "uri-reference",
  "iri",
  "iri-reference",
  "uri-template",
  "json-pointer",
  "relative-json-pointer",
  "regex",
  "uuid",
];

function validateSchemaObject(
  schema: Record<string, unknown>,
  path: string,
  errors: string[],
  warnings: string[],
  types: Set<string>
): number {
  let propertyCount = 0;

  const type = schema.type as string | string[] | undefined;
  if (type) {
    const typeArr = Array.isArray(type) ? type : [type];
    for (const t of typeArr) {
      if (!VALID_TYPES.includes(t)) {
        errors.push(`${path}: Invalid type '${t}'`);
      } else {
        types.add(t);
      }
    }
  }

  if (schema.format && typeof schema.format === "string") {
    if (!VALID_FORMATS.includes(schema.format)) {
      warnings.push(`${path}: Non-standard format '${schema.format}'`);
    }
  }

  if (schema.properties && typeof schema.properties === "object") {
    const props = schema.properties as Record<string, unknown>;
    propertyCount += Object.keys(props).length;
    for (const [key, val] of Object.entries(props)) {
      if (typeof val === "object" && val !== null) {
        propertyCount += validateSchemaObject(
          val as Record<string, unknown>,
          `${path}.properties.${key}`,
          errors,
          warnings,
          types
        );
      }
    }
  }

  if (schema.items && typeof schema.items === "object") {
    validateSchemaObject(
      schema.items as Record<string, unknown>,
      `${path}.items`,
      errors,
      warnings,
      types
    );
  }

  if (schema.required) {
    if (!Array.isArray(schema.required)) {
      errors.push(`${path}: 'required' must be an array`);
    } else {
      for (const req of schema.required) {
        if (typeof req !== "string") {
          errors.push(`${path}: 'required' items must be strings`);
        }
      }
    }
  }

  if (schema.minimum !== undefined && typeof schema.minimum !== "number") {
    errors.push(`${path}: 'minimum' must be a number`);
  }
  if (schema.maximum !== undefined && typeof schema.maximum !== "number") {
    errors.push(`${path}: 'maximum' must be a number`);
  }
  if (schema.minLength !== undefined && typeof schema.minLength !== "number") {
    errors.push(`${path}: 'minLength' must be a number`);
  }
  if (schema.maxLength !== undefined && typeof schema.maxLength !== "number") {
    errors.push(`${path}: 'maxLength' must be a number`);
  }

  if (schema.enum && !Array.isArray(schema.enum)) {
    errors.push(`${path}: 'enum' must be an array`);
  }

  if (schema.allOf && Array.isArray(schema.allOf)) {
    schema.allOf.forEach((s, i) => {
      if (typeof s === "object" && s !== null) {
        validateSchemaObject(
          s as Record<string, unknown>,
          `${path}.allOf[${i}]`,
          errors,
          warnings,
          types
        );
      }
    });
  }
  if (schema.anyOf && Array.isArray(schema.anyOf)) {
    schema.anyOf.forEach((s, i) => {
      if (typeof s === "object" && s !== null) {
        validateSchemaObject(
          s as Record<string, unknown>,
          `${path}.anyOf[${i}]`,
          errors,
          warnings,
          types
        );
      }
    });
  }
  if (schema.oneOf && Array.isArray(schema.oneOf)) {
    schema.oneOf.forEach((s, i) => {
      if (typeof s === "object" && s !== null) {
        validateSchemaObject(
          s as Record<string, unknown>,
          `${path}.oneOf[${i}]`,
          errors,
          warnings,
          types
        );
      }
    });
  }

  if (
    !schema.type &&
    !schema.$ref &&
    !schema.allOf &&
    !schema.anyOf &&
    !schema.oneOf &&
    !schema.enum
  ) {
    warnings.push(`${path}: No type specified`);
  }

  if (!schema.description && path !== "$") {
    warnings.push(`${path}: Missing description`);
  }

  return propertyCount;
}

function execute(input: Input): Output {
  if (!input.input.trim()) {
    throw new Error("Input cannot be empty");
  }

  let schema: Record<string, unknown>;
  try {
    schema = JSON.parse(input.input) as Record<string, unknown>;
  } catch {
    return {
      valid: false,
      errors: ["Invalid JSON: Could not parse input"],
      warnings: [],
      stats: { properties: 0, required: 0, types: [] },
    };
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  const types = new Set<string>();

  // Detect version
  let version: string | undefined;
  const schemaUri = schema.$schema as string | undefined;
  if (schemaUri) {
    if (schemaUri.includes("draft-07")) version = "Draft 7";
    else if (schemaUri.includes("draft-06")) version = "Draft 6";
    else if (schemaUri.includes("draft-04")) version = "Draft 4";
    else if (schemaUri.includes("2019-09")) version = "2019-09";
    else if (schemaUri.includes("2020-12")) version = "2020-12";
    else version = schemaUri;
  }

  const propertyCount = validateSchemaObject(
    schema,
    "$",
    errors,
    warnings,
    types
  );
  const requiredCount = Array.isArray(schema.required)
    ? schema.required.length
    : 0;

  return {
    valid: errors.length === 0,
    version,
    errors,
    warnings,
    stats: {
      properties: propertyCount,
      required: requiredCount,
      types: Array.from(types),
    },
  };
}

export const jsonSchemaValidatorApi = defineTool({
  meta: {
    id: "json/json-schema-validator-api",
    name: "JSON Schema Validator",
    description:
      "Free online JSON Schema validator — validate the structure of a JSON Schema document instantly in your browser. No data is stored. Checks types, formats, required fields, and detects draft version.",
    category: "json",
    subgroup: "JSON Schema",
    tier: ToolTier.CLIENT,
    keywords: ["json", "schema", "validate", "check", "draft"],
    examples: [
      {
        title: "Valid Schema",
        description: "Validate a well-formed JSON Schema document",
        input:
          '{\n  "$schema": "http://json-schema.org/draft-07/schema#",\n  "type": "object",\n  "properties": {\n    "name": {"type": "string", "description": "User name"},\n    "age": {"type": "integer", "minimum": 0}\n  },\n  "required": ["name"]\n}',
        output:
          '{\n  "valid": true,\n  "version": "Draft 7",\n  "errors": [],\n  "warnings": [\n    "$.properties.age: Missing description"\n  ],\n  "stats": {\n    "properties": 2,\n    "required": 1,\n    "types": [\n      "object",\n      "string",\n      "integer"\n    ]\n  }\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
