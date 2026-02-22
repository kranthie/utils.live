import { describe, it, expect } from "vitest";
import { apiMockGenerator } from "../../../src/tools/api/api-mock-generator";
import { executeTool } from "../../../src/core/executor";

describe("apiMockGenerator", () => {
  it("should have correct metadata", () => {
    expect(apiMockGenerator.meta.id).toBe("api/api-mock-generator");
    expect(apiMockGenerator.meta.category).toBe("api");
  });

  it("should generate mock from JSON Schema", async () => {
    const schema = JSON.stringify({
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "integer", minimum: 1, maximum: 100 },
        active: { type: "boolean" },
      },
    });
    const result = await executeTool(
      apiMockGenerator,
      { input: schema },
      { count: 2, wrapInArray: true }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>[];
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(2);
      expect(typeof data[0].name).toBe("string");
      expect(typeof data[0].age).toBe("number");
      expect(typeof data[0].active).toBe("boolean");
    }
  });

  it("should generate mock from sample data", async () => {
    const sample = JSON.stringify({
      id: 1,
      email: "test@example.com",
      active: true,
    });
    const result = await executeTool(
      apiMockGenerator,
      { input: sample },
      { count: 1, wrapInArray: false }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(typeof data.id).toBe("number");
      expect(typeof data.email).toBe("string");
      expect(typeof data.active).toBe("boolean");
    }
  });

  it("should infer email format from sample", async () => {
    const sample = JSON.stringify({ email: "user@example.com" });
    const result = await executeTool(
      apiMockGenerator,
      { input: sample },
      { count: 1, wrapInArray: false }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.email).toContain("@");
    }
  });

  it("should handle array sample", async () => {
    const sample = JSON.stringify([{ name: "Alice" }, { name: "Bob" }]);
    const result = await executeTool(
      apiMockGenerator,
      { input: sample },
      { count: 2, wrapInArray: true }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as unknown[];
      expect(Array.isArray(data)).toBe(true);
    }
  });

  it("should handle enum in schema", async () => {
    const schema = JSON.stringify({
      type: "string",
      enum: ["red", "green", "blue"],
    });
    const result = await executeTool(
      apiMockGenerator,
      { input: schema },
      { count: 1, wrapInArray: false }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as string;
      expect(["red", "green", "blue"]).toContain(data);
    }
  });

  it("should handle array type in schema", async () => {
    const schema = JSON.stringify({
      type: "array",
      items: { type: "integer" },
    });
    const result = await executeTool(
      apiMockGenerator,
      { input: schema },
      { count: 1, wrapInArray: false }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as unknown[];
      expect(Array.isArray(data)).toBe(true);
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(apiMockGenerator, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should fail on invalid JSON", async () => {
    const result = await executeTool(apiMockGenerator, { input: "not json" });
    expect(result.success).toBe(false);
  });
});
