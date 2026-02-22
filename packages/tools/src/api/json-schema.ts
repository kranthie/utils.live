import type { ZodSchema } from "zod";

/**
 * JSON Schema representation compatible with OpenAPI.
 */
export type JsonSchema = Record<string, unknown>;

// Internal type for accessing Zod internals (not part of public API).
// WARNING: This relies on Zod's private `_def` property, which is not part of the
// public API and may change between Zod versions. If upgrading Zod, verify that
// `_def.type` (Zod v4) or `_def.typeName` (Zod v3) still exists and contains the
// expected type discriminator strings. See getTypeName() below.
type ZodDef = Record<string, unknown>;

/**
 * Gets the type name from a Zod schema's internal definition.
 * Supports both Zod v3 (typeName) and Zod v4 (type) internal formats.
 */
function getTypeName(def: ZodDef | undefined): string | undefined {
  if (!def) return undefined;
  // Zod v4 uses `type` (e.g., "string", "object")
  // Zod v3 used `typeName` (e.g., "ZodString", "ZodObject")
  const v4Type = def.type as string | undefined;
  const v3TypeName = def.typeName as string | undefined;
  return v4Type ?? v3TypeName;
}

/**
 * Converts a Zod schema to JSON Schema format.
 *
 * This is a simplified implementation that handles common Zod types.
 * For full JSON Schema generation, consider using zod-to-json-schema.
 *
 * @param schema - Zod schema to convert
 * @returns JSON Schema representation
 *
 * @example
 * const inputSchema = z.object({ input: z.string() });
 * const jsonSchema = toJsonSchema(inputSchema);
 * // { type: 'object', properties: { input: { type: 'string' } } }
 */
export function toJsonSchema(schema: ZodSchema): JsonSchema {
  // Use Zod's internal description to build a basic schema
  const def = schema._def as unknown as ZodDef;
  const typeName = getTypeName(def);

  switch (typeName) {
    // Zod v4 type names
    case "object":
    case "ZodObject":
      return objectToJsonSchema(def);
    case "string":
    case "ZodString":
      return stringToJsonSchema(def, schema);
    case "number":
    case "ZodNumber":
      return numberToJsonSchema(def, schema);
    case "boolean":
    case "ZodBoolean":
      return { type: "boolean" };
    case "array":
    case "ZodArray":
      return arrayToJsonSchema(def);
    case "enum":
    case "ZodEnum":
      return enumToJsonSchema(def);
    case "optional":
    case "ZodOptional":
      return toJsonSchema(def.innerType as ZodSchema);
    case "default":
    case "ZodDefault": {
      const defaultValue = def.defaultValue;
      return {
        ...toJsonSchema(def.innerType as ZodSchema),
        // Zod v4: defaultValue is a plain value; Zod v3: defaultValue is a function
        default:
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          typeof defaultValue === "function" ? defaultValue() : defaultValue,
      };
    }
    case "nullable":
    case "ZodNullable":
      return {
        ...toJsonSchema(def.innerType as ZodSchema),
        nullable: true,
      };
    case "union":
    case "ZodUnion":
      return unionToJsonSchema(def);
    case "literal":
    case "ZodLiteral": {
      // Zod v4 uses `values` (array), Zod v3 uses `value`
      const literalValues = def.values as unknown[] | undefined;
      const literalValue = def.value;
      return {
        const: literalValues !== undefined ? literalValues[0] : literalValue,
      };
    }
    case "record":
    case "ZodRecord":
      return {
        type: "object",
        additionalProperties: toJsonSchema(def.valueType as ZodSchema),
      };
    case "unknown":
    case "ZodUnknown":
    case "any":
    case "ZodAny":
      return {};
    default:
      return {};
  }
}

function objectToJsonSchema(def: Record<string, unknown>): JsonSchema {
  const shape = def.shape as
    | Record<string, ZodSchema>
    | (() => Record<string, ZodSchema>);
  const shapeObj = typeof shape === "function" ? shape() : shape;

  const properties: Record<string, JsonSchema> = {};
  const required: string[] = [];

  for (const [key, value] of Object.entries(shapeObj)) {
    properties[key] = toJsonSchema(value);

    // Check if field is required (not optional/default)
    const fieldDef = (value as { _def?: unknown })._def as ZodDef | undefined;
    const fieldType = getTypeName(fieldDef);
    if (
      fieldType !== "optional" &&
      fieldType !== "ZodOptional" &&
      fieldType !== "default" &&
      fieldType !== "ZodDefault"
    ) {
      required.push(key);
    }
  }

  const result: JsonSchema = {
    type: "object",
    properties,
  };

  if (required.length > 0) {
    result.required = required;
  }

  return result;
}

function stringToJsonSchema(
  def: Record<string, unknown>,
  schema?: ZodSchema
): JsonSchema {
  const result: JsonSchema = { type: "string" };

  // Zod v4: string properties are on the schema object itself
  const schemaAny = schema as Record<string, unknown> | undefined;
  if (schemaAny) {
    const minLength = schemaAny.minLength as number | null | undefined;
    const maxLength = schemaAny.maxLength as number | null | undefined;
    const format = schemaAny.format as string | null | undefined;

    if (minLength != null) {
      result.minLength = minLength;
    }
    if (maxLength != null) {
      result.maxLength = maxLength;
    }
    if (format === "email") {
      result.format = "email";
    } else if (format === "url" || format === "uri") {
      result.format = "uri";
    } else if (format === "datetime") {
      result.format = "date-time";
    }
  }

  // Zod v3 fallback: check for checks array in _def
  const checks = def.checks as
    | Array<{ kind: string; value?: unknown }>
    | undefined;

  if (checks) {
    for (const check of checks) {
      // Zod v3 style checks with kind property
      if (check.kind) {
        switch (check.kind) {
          case "min":
            if (!result.minLength) result.minLength = check.value;
            break;
          case "max":
            if (!result.maxLength) result.maxLength = check.value;
            break;
          case "regex":
            result.pattern = String((check as { regex?: RegExp }).regex);
            break;
          case "email":
            if (!result.format) result.format = "email";
            break;
          case "url":
            if (!result.format) result.format = "uri";
            break;
          case "datetime":
            if (!result.format) result.format = "date-time";
            break;
        }
      }
    }
  }

  // Zod v4: check for regex format via schema's checks
  // In Zod v4, regex checks are $ZodCheckRegex objects with _zod.def.format === "regex"
  if (!result.pattern) {
    const v4Checks = def.checks as Array<Record<string, unknown>> | undefined;
    if (v4Checks) {
      for (const check of v4Checks) {
        // Zod v4: check._zod.def contains the check definition
        const zodInternal = check._zod as
          | { def?: { format?: string; pattern?: RegExp | string } }
          | undefined;
        if (zodInternal?.def?.format === "regex" && zodInternal.def.pattern) {
          const pattern = zodInternal.def.pattern;
          result.pattern = pattern instanceof RegExp ? pattern.source : pattern;
        }
      }
    }
  }

  return result;
}

function numberToJsonSchema(
  def: Record<string, unknown>,
  schema?: ZodSchema
): JsonSchema {
  // Zod v4: properties are on the schema object itself
  const schemaAny = schema as Record<string, unknown> | undefined;
  const isInt = schemaAny?.isInt === true;
  const minValue = schemaAny?.minValue as number | null | undefined;
  const maxValue = schemaAny?.maxValue as number | null | undefined;

  const result: JsonSchema = { type: isInt ? "integer" : "number" };

  if (minValue != null && Number.isFinite(minValue)) {
    result.minimum = minValue;
  }
  if (maxValue != null && Number.isFinite(maxValue)) {
    result.maximum = maxValue;
  }

  // Zod v3 fallback: checks array in _def
  const checks = def.checks as
    | Array<{ kind: string; value?: number }>
    | undefined;

  if (checks && !isInt) {
    const v3IsInt = checks.some((c) => c.kind === "int");
    if (v3IsInt) {
      result.type = "integer";
    }
  }

  if (checks && minValue == null && maxValue == null) {
    for (const check of checks) {
      if (check.kind) {
        switch (check.kind) {
          case "min":
            result.minimum = check.value;
            break;
          case "max":
            result.maximum = check.value;
            break;
        }
      }
    }
  }

  return result;
}

function arrayToJsonSchema(def: Record<string, unknown>): JsonSchema {
  // Zod v4 uses `element`, Zod v3 uses `type` for the item schema
  const itemType = (def.element ?? def.type) as ZodSchema | undefined;

  return {
    type: "array",
    items: itemType ? toJsonSchema(itemType) : {},
  };
}

function enumToJsonSchema(def: Record<string, unknown>): JsonSchema {
  // Zod v4 uses `entries` (object like {a:"a", b:"b"}), Zod v3 uses `values` (array)
  const entries = def.entries as Record<string, string> | undefined;
  const values = entries ? Object.values(entries) : (def.values as string[]);
  return {
    type: "string",
    enum: values,
  };
}

function unionToJsonSchema(def: Record<string, unknown>): JsonSchema {
  const options = def.options as ZodSchema[];
  return {
    oneOf: options.map((opt) => toJsonSchema(opt)),
  };
}

/**
 * Creates a JSON Schema with title and description.
 *
 * @param schema - Zod schema
 * @param title - Schema title
 * @param description - Schema description
 * @returns JSON Schema with metadata
 */
export function toJsonSchemaWithMeta(
  schema: ZodSchema,
  title: string,
  description?: string
): JsonSchema {
  const base = toJsonSchema(schema);
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title,
    ...(description && { description }),
    ...base,
  };
}
