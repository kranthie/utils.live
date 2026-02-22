import { describe, it, expect } from "vitest";
import { jsonSchemaFaker } from "../../../src/tools/json/json-schema-faker";
import { executeTool } from "../../../src/core/executor";

describe("JSON Schema Faker Tool", () => {
  it("should generate fake data from a simple schema", async () => {
    const schema = JSON.stringify({
      type: "object",
      properties: { name: { type: "string" }, age: { type: "integer" } },
      required: ["name", "age"],
    });
    const result = await executeTool(jsonSchemaFaker, { input: schema });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        String((result.data as Record<string, unknown>).output)
      ) as Record<string, unknown>;
      expect(data).toHaveProperty("name");
      expect(data).toHaveProperty("age");
    }
  });

  it("should generate string values", async () => {
    const schema = JSON.stringify({ type: "string" });
    const result = await executeTool(jsonSchemaFaker, { input: schema });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(
        typeof JSON.parse(
          String((result.data as Record<string, unknown>).output)
        )
      ).toBe("string");
    }
  });

  it("should handle arrays", async () => {
    const schema = JSON.stringify({ type: "array", items: { type: "number" } });
    const result = await executeTool(jsonSchemaFaker, { input: schema });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(
        Array.isArray(
          JSON.parse(String((result.data as Record<string, unknown>).output))
        )
      ).toBe(true);
    }
  });

  it("should handle invalid JSON", async () => {
    const result = await executeTool(jsonSchemaFaker, { input: "invalid" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBeDefined();
    }
  });

  it("should have correct metadata", () => {
    expect(jsonSchemaFaker.meta.id).toBe("json/json-schema-faker");
  });
});
