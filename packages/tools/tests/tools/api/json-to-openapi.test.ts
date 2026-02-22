import { describe, it, expect } from "vitest";
import { jsonToOpenapi } from "../../../src/tools/api/json-to-openapi";
import { executeTool } from "../../../src/core/executor";

describe("JSON to OpenAPI (YAML) Tool", () => {
  it("should convert JSON to YAML format", async () => {
    const json = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
    });
    const result = await executeTool(jsonToOpenapi, { input: json });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "openapi:"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "title:"
      );
    }
  });

  it("should handle nested objects", async () => {
    const json = JSON.stringify({ a: { b: { c: "value" } } });
    const result = await executeTool(jsonToOpenapi, { input: json });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("a:");
      expect((result.data as Record<string, unknown>).output).toContain("b:");
      expect((result.data as Record<string, unknown>).output).toContain("c:");
    }
  });

  it("should handle arrays", async () => {
    const json = JSON.stringify({ items: ["a", "b", "c"] });
    const result = await executeTool(jsonToOpenapi, { input: json });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "items:"
      );
    }
  });

  it("should handle invalid JSON", async () => {
    const result = await executeTool(jsonToOpenapi, { input: "not json" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBeDefined();
    }
  });

  it("should have correct metadata", () => {
    expect(jsonToOpenapi.meta.id).toBe("api/json-to-openapi");
  });
});
