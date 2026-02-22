import { describe, it, expect } from "vitest";
import { swagger2ToOpenapi3 } from "../../../src/tools/api/swagger2-to-openapi3";
import { executeTool } from "../../../src/core/executor";

describe("Swagger 2 to OpenAPI 3 Tool", () => {
  it("should convert a basic Swagger 2.0 spec", async () => {
    const swagger = JSON.stringify({
      swagger: "2.0",
      info: { title: "Test API", version: "1.0.0" },
      host: "api.example.com",
      basePath: "/v1",
      paths: {},
    });
    const result = await executeTool(swagger2ToOpenapi3, { input: swagger });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = JSON.parse(
        String((result.data as Record<string, unknown>).output)
      ) as Record<string, unknown>;
      expect(output.openapi).toBe("3.0.3");
      expect(output.servers).toBeDefined();
    }
  });

  it("should convert definitions to components/schemas", async () => {
    const swagger = JSON.stringify({
      swagger: "2.0",
      info: { title: "Test", version: "1.0.0" },
      paths: {},
      definitions: {
        User: { type: "object", properties: { name: { type: "string" } } },
      },
    });
    const result = await executeTool(swagger2ToOpenapi3, { input: swagger });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = JSON.parse(
        String((result.data as Record<string, unknown>).output)
      ) as Record<string, Record<string, unknown>>;
      expect(output.components.schemas.User).toBeDefined();
    }
  });

  it("should handle invalid JSON", async () => {
    const result = await executeTool(swagger2ToOpenapi3, { input: "not json" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBeDefined();
    }
  });

  it("should have correct metadata", () => {
    expect(swagger2ToOpenapi3.meta.id).toBe("api/swagger2-to-openapi3");
  });
});
