import { describe, it, expect } from "vitest";
import { openapiToJsonSchema } from "../../../src/tools/api/openapi-to-json-schema";
import { executeTool } from "../../../src/core/executor";

describe("OpenAPI to JSON Schema Tool", () => {
  it("should extract schemas from OpenAPI spec", async () => {
    const spec = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
      components: {
        schemas: {
          User: { type: "object", properties: { name: { type: "string" } } },
        },
      },
      paths: {},
    });
    const result = await executeTool(openapiToJsonSchema, { input: spec });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("User");
    }
  });

  it("should handle spec with no schemas", async () => {
    const spec = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
      paths: {},
    });
    const result = await executeTool(openapiToJsonSchema, { input: spec });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain("No schemas found");
    }
  });

  it("should handle invalid JSON", async () => {
    const result = await executeTool(openapiToJsonSchema, { input: "invalid" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBeDefined();
    }
  });

  it("should have correct metadata", () => {
    expect(openapiToJsonSchema.meta.id).toBe("api/openapi-to-json-schema");
  });
});
