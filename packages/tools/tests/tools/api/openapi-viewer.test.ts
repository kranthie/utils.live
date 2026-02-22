import { describe, it, expect } from "vitest";
import { openapiViewer } from "../../../src/tools/api/openapi-viewer";
import { executeTool } from "../../../src/core/executor";

describe("OpenAPI Viewer Tool", () => {
  const sampleSpec = JSON.stringify({
    openapi: "3.0.0",
    info: { title: "Test API", version: "1.0.0", description: "A test API" },
    paths: {
      "/users": {
        get: {
          summary: "Get users",
          responses: { "200": { description: "OK" } },
        },
        post: {
          summary: "Create user",
          responses: { "201": { description: "Created" } },
        },
      },
    },
  });

  it("should parse a valid OpenAPI JSON spec", async () => {
    const result = await executeTool(openapiViewer, { input: sampleSpec });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "Test API"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "1.0.0"
      );
    }
  });

  it("should list endpoints", async () => {
    const result = await executeTool(openapiViewer, { input: sampleSpec });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "/users"
      );
      expect((result.data as Record<string, unknown>).output).toContain("GET");
    }
  });

  it("should handle non-JSON input gracefully", async () => {
    const result = await executeTool(openapiViewer, { input: "not json" });
    expect(result.success).toBe(true);
    if (result.success) {
      // The viewer falls back to YAML-like parsing for non-JSON input
      expect((result.data as Record<string, unknown>).output).toBeDefined();
    }
  });

  it("should have correct metadata", () => {
    expect(openapiViewer.meta.id).toBe("api/openapi-viewer");
    expect(openapiViewer.meta.category).toBe("api");
  });
});
