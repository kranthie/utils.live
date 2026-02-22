import { describe, it, expect } from "vitest";
import { jsonSchemaToOpenapi } from "../../../src/tools/api/json-schema-to-openapi";
import { executeTool } from "../../../src/core/executor";

describe("JSON Schema to OpenAPI Tool", () => {
  it("should convert a JSON schema to OpenAPI component", async () => {
    const schema = JSON.stringify({
      type: "object",
      properties: { name: { type: "string" }, age: { type: "integer" } },
    });
    const result = await executeTool(jsonSchemaToOpenapi, { input: schema });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBeDefined();
    }
  });

  it("should handle schema with $ref", async () => {
    const schema = JSON.stringify({
      type: "object",
      properties: { user: { $ref: "#/definitions/User" } },
      definitions: { User: { type: "object" } },
    });
    const result = await executeTool(jsonSchemaToOpenapi, { input: schema });
    expect(result.success).toBe(true);
  });

  it("should handle invalid JSON", async () => {
    const result = await executeTool(jsonSchemaToOpenapi, { input: "invalid" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBeDefined();
    }
  });

  it("should have correct metadata", () => {
    expect(jsonSchemaToOpenapi.meta.id).toBe("api/json-schema-to-openapi");
  });
});
