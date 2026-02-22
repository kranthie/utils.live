import { describe, it, expect } from "vitest";
import { jsonSchemaGenerator } from "../../../src/tools/json/json-schema-generator";
import { executeTool } from "../../../src/core/executor";

type JsonSchema = Record<string, unknown>;
type SchemaProperties = Record<string, Record<string, unknown>>;

describe("jsonSchemaGenerator", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(jsonSchemaGenerator.meta.id).toBe("json/json-schema-generator");
      expect(jsonSchemaGenerator.meta.category).toBe("json");
    });
  });

  describe("execute", () => {
    it("should generate schema for simple object", async () => {
      const result = await executeTool(jsonSchemaGenerator, {
        input: '{"name": "John", "age": 30}',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        const schema = JSON.parse(output) as JsonSchema;
        expect(schema.$schema).toContain("draft-07");
        expect(schema.type).toBe("object");
        const properties = schema.properties as SchemaProperties;
        expect(properties.name.type).toBe("string");
        expect(properties.age.type).toBe("integer");
        expect(schema.required).toContain("name");
      }
    });

    it("should infer date-time format", async () => {
      const result = await executeTool(jsonSchemaGenerator, {
        input: '{"created": "2024-01-01T12:00:00Z"}',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        const schema = JSON.parse(output) as JsonSchema;
        const properties = schema.properties as SchemaProperties;
        expect(properties.created.format).toBe("date-time");
      }
    });

    it("should infer email format", async () => {
      const result = await executeTool(jsonSchemaGenerator, {
        input: '{"email": "user@example.com"}',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        const schema = JSON.parse(output) as JsonSchema;
        const properties = schema.properties as SchemaProperties;
        expect(properties.email.format).toBe("email");
      }
    });

    it("should infer uri format", async () => {
      const result = await executeTool(jsonSchemaGenerator, {
        input: '{"url": "https://example.com"}',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        const schema = JSON.parse(output) as JsonSchema;
        const properties = schema.properties as SchemaProperties;
        expect(properties.url.format).toBe("uri");
      }
    });

    it("should handle arrays", async () => {
      const result = await executeTool(jsonSchemaGenerator, {
        input: '{"items": [1, 2, 3]}',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        const schema = JSON.parse(output) as JsonSchema;
        const properties = schema.properties as SchemaProperties;
        expect(properties.items.type).toBe("array");
        expect((properties.items.items as Record<string, unknown>).type).toBe(
          "integer"
        );
      }
    });

    it("should handle null values", async () => {
      const result = await executeTool(jsonSchemaGenerator, {
        input: '{"value": null}',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        const schema = JSON.parse(output) as JsonSchema;
        const properties = schema.properties as SchemaProperties;
        expect(properties.value.type).toBe("null");
      }
    });

    it("should use draft-04 when specified", async () => {
      const result = await executeTool(
        jsonSchemaGenerator,
        { input: '{"x": 1}' },
        { draft: "draft-04" }
      );
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        const schema = JSON.parse(output) as JsonSchema;
        expect(schema.$schema).toContain("draft-04");
      }
    });

    it("should add title and description", async () => {
      const result = await executeTool(
        jsonSchemaGenerator,
        { input: '{"x": 1}' },
        { title: "My Schema", description: "A test schema" }
      );
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        const schema = JSON.parse(output) as JsonSchema;
        expect(schema.title).toBe("My Schema");
        expect(schema.description).toBe("A test schema");
      }
    });

    it("should omit required when option is false", async () => {
      const result = await executeTool(
        jsonSchemaGenerator,
        { input: '{"x": 1}' },
        { required: false }
      );
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        const schema = JSON.parse(output) as JsonSchema;
        expect(schema.required).toBeUndefined();
      }
    });

    it("should reject empty input", async () => {
      const result = await executeTool(jsonSchemaGenerator, { input: "" });
      expect(result.success).toBe(false);
    });

    it("should reject invalid JSON", async () => {
      const result = await executeTool(jsonSchemaGenerator, {
        input: "invalid",
      });
      expect(result.success).toBe(false);
    });
  });
});
