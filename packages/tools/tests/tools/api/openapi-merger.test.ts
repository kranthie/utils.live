import { describe, it, expect } from "vitest";
import { openapiMerger } from "../../../src/tools/api/openapi-merger";
import { executeTool } from "../../../src/core/executor";

describe("OpenAPI Merger Tool", () => {
  it("should merge two specs", async () => {
    const spec1 = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "API 1", version: "1.0.0" },
      paths: { "/users": { get: { summary: "Get users" } } },
    });
    const spec2 = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "API 2", version: "1.0.0" },
      paths: { "/products": { get: { summary: "Get products" } } },
    });
    const result = await executeTool(openapiMerger, {
      input1: spec1,
      input2: spec2,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).original).toBeDefined();
      expect((result.data as Record<string, unknown>).modified).toBeDefined();
    }
  });

  it("should handle invalid JSON in first input", async () => {
    const result = await executeTool(openapiMerger, {
      input1: "not json",
      input2: "{}",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBeDefined();
    }
  });

  it("should have correct metadata", () => {
    expect(openapiMerger.meta.id).toBe("api/openapi-merger");
  });
});
