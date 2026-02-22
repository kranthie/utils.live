import { describe, it, expect } from "vitest";
import { openapiToJson } from "../../../src/tools/api/openapi-to-json";
import { executeTool } from "../../../src/core/executor";

describe("OpenAPI to JSON Tool", () => {
  it("should convert YAML to JSON", async () => {
    const yaml = `openapi: "3.0.0"\ninfo:\n  title: "Test"\n  version: "1.0.0"`;
    const result = await executeTool(openapiToJson, { input: yaml });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "openapi"
      );
      const parsed = JSON.parse(
        String((result.data as Record<string, unknown>).output)
      ) as Record<string, unknown>;
      expect(parsed.openapi).toBe("3.0.0");
    }
  });

  it("should pass through valid JSON", async () => {
    const json = JSON.stringify({ openapi: "3.0.0", info: { title: "Test" } });
    const result = await executeTool(openapiToJson, { input: json });
    expect(result.success).toBe(true);
    if (result.success) {
      const parsed = JSON.parse(
        String((result.data as Record<string, unknown>).output)
      ) as Record<string, unknown>;
      expect(parsed.openapi).toBe("3.0.0");
    }
  });

  it("should handle simple key-value YAML", async () => {
    const yaml = `key: value\nname: test`;
    const result = await executeTool(openapiToJson, { input: yaml });
    expect(result.success).toBe(true);
    if (result.success) {
      const parsed = JSON.parse(
        String((result.data as Record<string, unknown>).output)
      ) as Record<string, unknown>;
      expect(parsed.key).toBe("value");
    }
  });

  it("should have correct metadata", () => {
    expect(openapiToJson.meta.id).toBe("api/openapi-to-json");
  });
});
