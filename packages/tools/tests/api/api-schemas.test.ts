import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  executeToolRequestSchema,
  executeToolResponseSchema,
  listToolsQuerySchema,
  toolPathParamsSchema,
  toolSummarySchema,
  toolDetailSchema,
  categoryWithCountSchema,
  HTTP_ERRORS,
  API_ROUTES,
} from "../../src/api/schemas";
import { toApiResponse, createApiError } from "../../src/api/response";
import { toJsonSchema, toJsonSchemaWithMeta } from "../../src/api/json-schema";
import type { ToolResult } from "../../src/types";
import { ToolTier } from "../../src/types";

describe("API Schemas", () => {
  describe("executeToolRequestSchema", () => {
    it("should accept valid request", () => {
      const result = executeToolRequestSchema.safeParse({
        input: { input: '{"a":1}' },
        options: { indent: 4 },
      });
      expect(result.success).toBe(true);
    });

    it("should accept request without options", () => {
      const result = executeToolRequestSchema.safeParse({
        input: { input: '{"a":1}' },
      });
      expect(result.success).toBe(true);
    });

    it("should accept any input type", () => {
      const result = executeToolRequestSchema.safeParse({
        input: "plain string",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("listToolsQuerySchema", () => {
    it("should apply defaults", () => {
      const result = listToolsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).page).toBe(1);
        expect((result.data as Record<string, unknown>).limit).toBe(20);
      }
    });

    it("should accept valid query params", () => {
      const result = listToolsQuerySchema.safeParse({
        category: "json",
        q: "formatter",
        tier: "client",
        page: 2,
        limit: 50,
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid category format", () => {
      const result = listToolsQuerySchema.safeParse({
        category: "JSON", // uppercase not allowed
      });
      expect(result.success).toBe(false);
    });

    it("should coerce string numbers", () => {
      const result = listToolsQuerySchema.safeParse({
        page: "3",
        limit: "25",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).page).toBe(3);
        expect((result.data as Record<string, unknown>).limit).toBe(25);
      }
    });
  });

  describe("toolPathParamsSchema", () => {
    it("should accept valid tool ID", () => {
      const result = toolPathParamsSchema.safeParse({
        toolId: "json/formatter",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid tool ID format", () => {
      const result = toolPathParamsSchema.safeParse({
        toolId: "json-formatter", // missing slash
      });
      expect(result.success).toBe(false);
    });
  });

  describe("toolSummarySchema", () => {
    it("should accept valid tool summary", () => {
      const result = toolSummarySchema.safeParse({
        id: "json/formatter",
        name: "JSON Formatter",
        description: "Format JSON with configurable indentation",
        category: "json",
        tier: "client",
        keywords: ["json", "format"],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("toolDetailSchema", () => {
    it("should accept valid tool detail", () => {
      const result = toolDetailSchema.safeParse({
        id: "json/formatter",
        name: "JSON Formatter",
        description: "Format JSON with configurable indentation",
        category: "json",
        tier: "client",
        keywords: ["json", "format"],
        inputSchema: { type: "object" },
        outputSchema: { type: "object" },
      });
      expect(result.success).toBe(true);
    });

    it("should accept detail with credits config", () => {
      const result = toolDetailSchema.safeParse({
        id: "text/word-counter",
        name: "Word Counter",
        description: "Count words in text",
        category: "text",
        tier: "client",
        keywords: ["text", "words"],
        inputSchema: { type: "object" },
        outputSchema: { type: "object" },
        credits: { base: 5, perKb: 0.1, max: 20 },
      });
      expect(result.success).toBe(true);
    });
  });

  describe("executeToolResponseSchema", () => {
    it("should accept success response", () => {
      const result = executeToolResponseSchema.safeParse({
        success: true,
        data: { output: '{\n  "a": 1\n}' },
        meta: {
          executionTimeMs: 5,
          inputSizeBytes: 10,
          outputSizeBytes: 20,
          creditsUsed: 0,
          tier: "client",
          timestamp: new Date().toISOString(),
        },
      });
      expect(result.success).toBe(true);
    });

    it("should accept error response", () => {
      const result = executeToolResponseSchema.safeParse({
        success: false,
        error: {
          code: "PARSE_INVALID_JSON",
          message: "Invalid JSON syntax",
        },
        meta: {
          executionTimeMs: 1,
          inputSizeBytes: 5,
          outputSizeBytes: 0,
          creditsUsed: 0,
          tier: "client",
          timestamp: new Date().toISOString(),
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe("categoryWithCountSchema", () => {
    it("should accept valid category", () => {
      const result = categoryWithCountSchema.safeParse({
        id: "json",
        name: "JSON Tools",
        description: "Tools for working with JSON",
        icon: "Braces",
        order: 1,
        slug: "json",
        toolCount: 15,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("HTTP_ERRORS", () => {
    it("should have correct status codes", () => {
      expect(HTTP_ERRORS.BAD_REQUEST.status).toBe(400);
      expect(HTTP_ERRORS.UNAUTHORIZED.status).toBe(401);
      expect(HTTP_ERRORS.PAYMENT_REQUIRED.status).toBe(402);
      expect(HTTP_ERRORS.NOT_FOUND.status).toBe(404);
      expect(HTTP_ERRORS.RATE_LIMITED.status).toBe(429);
      expect(HTTP_ERRORS.INTERNAL_ERROR.status).toBe(500);
    });
  });

  describe("API_ROUTES", () => {
    it("should define all routes", () => {
      expect(API_ROUTES.LIST_TOOLS.path).toBe("/api/tools");
      expect(API_ROUTES.GET_TOOL.path).toBe("/api/tools/:toolId");
      expect(API_ROUTES.EXECUTE_TOOL.path).toBe("/api/tools/:toolId/execute");
      expect(API_ROUTES.LIST_CATEGORIES.path).toBe("/api/categories");
    });
  });
});

describe("toApiResponse", () => {
  const baseMeta = {
    executionTimeMs: 10,
    inputSizeBytes: 100,
    outputSizeBytes: 200,
    creditsUsed: 0,
    tier: ToolTier.CLIENT,
    timestamp: "2026-01-01T00:00:00.000Z",
  };

  it("should convert success result", () => {
    const result: ToolResult<{ output: string }> = {
      success: true,
      data: { output: "formatted" },
      meta: baseMeta,
    };

    const response = toApiResponse(result);
    expect(response.success).toBe(true);
    if (response.success) {
      expect(response.data).toEqual({ output: "formatted" });
      expect(response.meta.executionTimeMs).toBe(10);
    }
  });

  it("should convert failure result", () => {
    const result: ToolResult<unknown> = {
      success: false,
      error: {
        code: "PARSE_INVALID_JSON",
        message: "Invalid JSON",
        line: 1,
        column: 5,
      },
      meta: baseMeta,
    };

    const response = toApiResponse(result);
    expect(response.success).toBe(false);
    if (!response.success) {
      expect(response.error.code).toBe("PARSE_INVALID_JSON");
      expect(response.error.line).toBe(1);
    }
  });

  it("should omit undefined error fields", () => {
    const result: ToolResult<unknown> = {
      success: false,
      error: {
        code: "INPUT_REQUIRED",
        message: "Input is required",
      },
      meta: baseMeta,
    };

    const response = toApiResponse(result);
    expect(response.success).toBe(false);
    if (!response.success) {
      expect("line" in response.error).toBe(false);
      expect("column" in response.error).toBe(false);
    }
  });
});

describe("createApiError", () => {
  it("should create error without details", () => {
    const error = createApiError("NOT_FOUND", "Tool not found");
    expect(error.error.code).toBe("NOT_FOUND");
    expect(error.error.message).toBe("Tool not found");
    expect("details" in error.error).toBe(false);
  });

  it("should create error with details", () => {
    const error = createApiError("BAD_REQUEST", "Invalid input", {
      field: "input",
    });
    expect(error.error.details).toEqual({ field: "input" });
  });
});

describe("toJsonSchema", () => {
  it("should convert string schema", () => {
    const schema = z.string();
    const json = toJsonSchema(schema);
    expect(json).toEqual({ type: "string" });
  });

  it("should convert number schema with constraints", () => {
    const schema = z.number().int().min(0).max(10);
    const json = toJsonSchema(schema);
    expect(json.type).toBe("integer");
    expect(json.minimum).toBe(0);
    expect(json.maximum).toBe(10);
  });

  it("should convert object schema", () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });
    const json = toJsonSchema(schema);
    expect(json.type).toBe("object");
    expect(json.properties).toEqual({
      name: { type: "string" },
      age: { type: "number" },
    });
    expect(json.required).toEqual(["name", "age"]);
  });

  it("should handle optional fields", () => {
    const schema = z.object({
      required: z.string(),
      optional: z.string().optional(),
    });
    const json = toJsonSchema(schema);
    expect(json.required).toEqual(["required"]);
  });

  it("should handle default values", () => {
    const schema = z.object({
      indent: z.number().default(2),
    });
    const json = toJsonSchema(schema);
    expect((json.properties as Record<string, unknown>).indent).toEqual({
      type: "number",
      default: 2,
    });
  });

  it("should convert array schema", () => {
    const schema = z.array(z.string());
    const json = toJsonSchema(schema);
    expect(json.type).toBe("array");
    expect(json.items).toEqual({ type: "string" });
  });

  it("should convert enum schema", () => {
    const schema = z.enum(["a", "b", "c"]);
    const json = toJsonSchema(schema);
    expect(json.type).toBe("string");
    expect(json.enum).toEqual(["a", "b", "c"]);
  });

  it("should convert boolean schema", () => {
    const schema = z.boolean();
    const json = toJsonSchema(schema);
    expect(json).toEqual({ type: "boolean" });
  });

  it("should convert string with min/max length", () => {
    const schema = z.string().min(5).max(100);
    const json = toJsonSchema(schema);
    expect(json.type).toBe("string");
    expect(json.minLength).toBe(5);
    expect(json.maxLength).toBe(100);
  });

  it("should convert string with regex pattern", () => {
    const schema = z.string().regex(/^[a-z]+$/);
    const json = toJsonSchema(schema);
    expect(json.type).toBe("string");
    expect(json.pattern).toBeDefined();
  });

  it("should convert string with email format", () => {
    const schema = z.string().email();
    const json = toJsonSchema(schema);
    expect(json.type).toBe("string");
    expect(json.format).toBe("email");
  });

  it("should convert string with url format", () => {
    const schema = z.string().url();
    const json = toJsonSchema(schema);
    expect(json.type).toBe("string");
    expect(json.format).toBe("uri");
  });

  it("should convert string with datetime format", () => {
    const schema = z.string().datetime();
    const json = toJsonSchema(schema);
    expect(json.type).toBe("string");
    expect(json.format).toBe("date-time");
  });

  it("should convert nullable schema", () => {
    const schema = z.string().nullable();
    const json = toJsonSchema(schema);
    expect(json.type).toBe("string");
    expect(json.nullable).toBe(true);
  });

  it("should convert union schema", () => {
    const schema = z.union([z.string(), z.number()]);
    const json = toJsonSchema(schema);
    expect(json.oneOf).toBeDefined();
    expect(json.oneOf).toHaveLength(2);
  });

  it("should convert literal schema", () => {
    const schema = z.literal("fixed");
    const json = toJsonSchema(schema);
    expect(json.const).toBe("fixed");
  });

  it("should convert record schema", () => {
    const schema = z.record(z.string(), z.number());
    const json = toJsonSchema(schema);
    expect(json.type).toBe("object");
    expect(json.additionalProperties).toEqual({ type: "number" });
  });

  it("should handle unknown schema", () => {
    const schema = z.unknown();
    const json = toJsonSchema(schema);
    expect(json).toEqual({});
  });

  it("should handle any schema", () => {
    const schema = z.any();
    const json = toJsonSchema(schema);
    expect(json).toEqual({});
  });

  it("should handle unsupported Zod types with default case", () => {
    // Create a mock schema with an unknown type
    const mockSchema = {
      _def: { type: "unsupported-type" },
    } as unknown as z.ZodSchema;
    const json = toJsonSchema(mockSchema);
    expect(json).toEqual({});
  });

  it("should handle object schema where shape is a plain object (not a function)", () => {
    // Mock an object schema where shape is a plain object, not a function
    // This tests the false branch of `typeof shape === "function"`
    const mockSchema = {
      _def: {
        type: "object",
        shape: {
          // Plain object, not a function
          name: { _def: { type: "string" } },
          age: { _def: { type: "number" } },
        },
      },
    } as unknown as z.ZodSchema;
    const json = toJsonSchema(mockSchema);
    expect(json.type).toBe("object");
    expect(json.properties).toBeDefined();
    expect((json.properties as Record<string, unknown>).name).toEqual({
      type: "string",
    });
    expect((json.properties as Record<string, unknown>).age).toEqual({
      type: "number",
    });
  });

  it("should handle array without defined item type", () => {
    // Create a mock array schema without element
    const mockSchema = {
      _def: {
        type: "array",
        element: undefined, // no item type defined
      },
    } as unknown as z.ZodSchema;
    const json = toJsonSchema(mockSchema);
    expect(json.type).toBe("array");
    expect(json.items).toEqual({});
  });

  it("should handle number without int constraint", () => {
    const schema = z.number().min(0).max(100);
    const json = toJsonSchema(schema);
    expect(json.type).toBe("number");
    expect(json.minimum).toBe(0);
    expect(json.maximum).toBe(100);
  });
});

describe("toJsonSchemaWithMeta", () => {
  it("should add metadata", () => {
    const schema = z.object({ input: z.string() });
    const json = toJsonSchemaWithMeta(schema, "InputSchema", "Input for tool");
    expect(json.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
    expect(json.title).toBe("InputSchema");
    expect(json.description).toBe("Input for tool");
    expect(json.type).toBe("object");
  });

  it("should work without description", () => {
    const schema = z.object({ input: z.string() });
    const json = toJsonSchemaWithMeta(schema, "InputSchema");
    expect(json.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
    expect(json.title).toBe("InputSchema");
    expect(json.description).toBeUndefined();
    expect(json.type).toBe("object");
  });
});

describe("toApiResponse - additional edge cases", () => {
  const baseMeta = {
    executionTimeMs: 10,
    inputSizeBytes: 100,
    outputSizeBytes: 200,
    creditsUsed: 0,
    tier: ToolTier.CLIENT,
    timestamp: "2026-01-01T00:00:00.000Z",
  };

  it("should include details field when present", () => {
    const result: ToolResult<unknown> = {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: { issues: ["field1 is required", "field2 must be a number"] },
      },
      meta: baseMeta,
    };

    const response = toApiResponse(result);
    expect(response.success).toBe(false);
    if (!response.success) {
      expect(response.error.details).toEqual({
        issues: ["field1 is required", "field2 must be a number"],
      });
    }
  });

  it("should include field when present in error", () => {
    const result: ToolResult<unknown> = {
      success: false,
      error: {
        code: "INPUT_INVALID_TYPE",
        message: "Field must be string",
        field: "userName",
      },
      meta: baseMeta,
    };

    const response = toApiResponse(result);
    expect(response.success).toBe(false);
    if (!response.success) {
      expect(response.error.field).toBe("userName");
    }
  });
});
