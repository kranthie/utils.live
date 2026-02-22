import { describe, it, expect } from "vitest";
import { openapiMock } from "../../../src/tools/api/openapi-mock";
import { executeTool } from "../../../src/core/executor";

describe("OpenAPI Mock Tool", () => {
  it("should generate mock data from a spec", async () => {
    const spec = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
      paths: {
        "/users": {
          get: {
            responses: {
              "200": {
                description: "OK",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        age: { type: "integer" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    const result = await executeTool(openapiMock, { input: spec });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBeDefined();
    }
  });

  it("should handle spec with no paths", async () => {
    const spec = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
      paths: {},
    });
    const result = await executeTool(openapiMock, { input: spec });
    expect(result.success).toBe(true);
  });

  it("should handle invalid JSON", async () => {
    const result = await executeTool(openapiMock, { input: "invalid" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBeDefined();
    }
  });

  it("should have correct metadata", () => {
    expect(openapiMock.meta.id).toBe("api/openapi-mock");
  });
});
