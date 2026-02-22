import { describe, it, expect } from "vitest";
import { openapiFormatter } from "../../../src/tools/api/openapi-formatter";
import { executeTool } from "../../../src/core/executor";

describe("OpenAPI Formatter Tool", () => {
  it("should format a valid OpenAPI spec", async () => {
    const spec = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
      paths: {},
    });
    const result = await executeTool(openapiFormatter, { input: spec });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "openapi"
      );
      expect((result.data as Record<string, unknown>).output).toContain("  "); // indented
    }
  });

  it("should handle already formatted JSON", async () => {
    const spec = JSON.stringify(
      { openapi: "3.0.0", info: { title: "API", version: "2.0" } },
      null,
      2
    );
    const result = await executeTool(openapiFormatter, { input: spec });
    expect(result.success).toBe(true);
  });

  it("should handle invalid JSON", async () => {
    const result = await executeTool(openapiFormatter, { input: "not json" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBeDefined();
    }
  });

  it("should have correct metadata", () => {
    expect(openapiFormatter.meta.id).toBe("api/openapi-formatter");
  });
});
