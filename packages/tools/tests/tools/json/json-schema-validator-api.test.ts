import { describe, it, expect } from "vitest";
import { jsonSchemaValidatorApi } from "../../../src/tools/json/json-schema-validator-api";
import { executeTool } from "../../../src/core/executor";

describe("JSON Schema Validator API Tool", () => {
  it("should validate a correct JSON schema", async () => {
    const schema = JSON.stringify({
      type: "object",
      properties: { name: { type: "string" }, age: { type: "integer" } },
      required: ["name"],
    });
    const result = await executeTool(jsonSchemaValidatorApi, { input: schema });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).valid).toBe(true);
      expect((result.data as Record<string, unknown>).errors).toHaveLength(0);
    }
  });

  it("should detect invalid type value", async () => {
    const schema = JSON.stringify({ type: "invalid-type" });
    const result = await executeTool(jsonSchemaValidatorApi, { input: schema });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).valid).toBe(false);
      expect(
        (result.data as Record<string, unknown>).errors.length
      ).toBeGreaterThan(0);
    }
  });

  it("should handle invalid JSON", async () => {
    const result = await executeTool(jsonSchemaValidatorApi, {
      input: "not json",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).valid).toBe(false);
      expect((result.data as Record<string, unknown>).errors).toContainEqual(
        expect.stringContaining("Invalid JSON")
      );
    }
  });

  it("should have correct metadata", () => {
    expect(jsonSchemaValidatorApi.meta.id).toBe(
      "json/json-schema-validator-api"
    );
  });
});
