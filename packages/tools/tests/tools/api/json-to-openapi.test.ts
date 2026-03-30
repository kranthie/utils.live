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

  it("should render nested single-key objects on separate lines", async () => {
    // Regression: nested single-key objects were being collapsed to
    // "200: description: OK" (invalid YAML) instead of proper block style
    const json = JSON.stringify({
      responses: {
        "200": { description: "OK" },
      },
    });
    const result = await executeTool(jsonToOpenapi, { input: json });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as Record<string, unknown>).output as string;
      // Must NOT collapse nested key onto parent line
      expect(output).not.toContain("200: description:");
      // Must have description on its own line
      expect(output).toContain("description: OK");
      // 200 key must be on its own line as a block key
      expect(output).toMatch(/["']?200["']?:/);
    }
  });

  it("should produce valid YAML for deeply nested paths object", async () => {
    const json = JSON.stringify({
      paths: {
        "/users": {
          get: {
            summary: "List users",
            responses: { "200": { description: "OK" } },
          },
        },
      },
    });
    const result = await executeTool(jsonToOpenapi, { input: json });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as Record<string, unknown>).output as string;
      // Each nested key must appear on its own line
      expect(output).toContain("paths:");
      expect(output).toContain("/users:");
      expect(output).toContain("get:");
      expect(output).toContain("summary:");
      expect(output).toContain("responses:");
      expect(output).toContain("description: OK");
      // Should never collapse to "responses: 200: description: OK"
      expect(output).not.toMatch(/responses: \S/);
    }
  });

  it("should handle empty objects and arrays inline", async () => {
    const json = JSON.stringify({ schema: {}, tags: [] });
    const result = await executeTool(jsonToOpenapi, { input: json });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as Record<string, unknown>).output as string;
      expect(output).toContain("schema: {}");
      expect(output).toContain("tags: []");
    }
  });

  it("should have correct metadata", () => {
    expect(jsonToOpenapi.meta.id).toBe("api/json-to-openapi");
  });
});
