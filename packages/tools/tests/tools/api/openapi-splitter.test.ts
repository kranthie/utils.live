import { describe, it, expect } from "vitest";
import { openapiSplitter } from "../../../src/tools/api/openapi-splitter";
import { executeTool } from "../../../src/core/executor";

describe("OpenAPI Splitter Tool", () => {
  it("should split spec by tag", async () => {
    const spec = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
      paths: {
        "/users": { get: { tags: ["users"], summary: "Get users" } },
        "/products": { get: { tags: ["products"], summary: "Get products" } },
      },
    });
    const result = await executeTool(openapiSplitter, { input: spec });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBeDefined();
    }
  });

  it("should handle spec with no tags", async () => {
    const spec = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
      paths: { "/users": { get: { summary: "Get users" } } },
    });
    const result = await executeTool(openapiSplitter, { input: spec });
    expect(result.success).toBe(true);
  });

  it("should handle invalid JSON", async () => {
    const result = await executeTool(openapiSplitter, { input: "invalid" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBeDefined();
    }
  });

  it("should have correct metadata", () => {
    expect(openapiSplitter.meta.id).toBe("api/openapi-splitter");
  });
});
