import { describe, it, expect } from "vitest";
import { jsonSchemaToTypescript } from "../../../src/tools/json/json-schema-to-typescript";
import { executeTool } from "../../../src/core/executor";

describe("jsonSchemaToTypescript", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(jsonSchemaToTypescript.meta.id).toBe("json/json-schema-to-typescript");
      expect(jsonSchemaToTypescript.meta.category).toBe("json");
    });
  });

  describe("execute", () => {
    it("should convert simple object schema", async () => {
      const schema = JSON.stringify({
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "integer" },
        },
        required: ["name"],
      });
      const result = await executeTool(jsonSchemaToTypescript, { input: schema });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("name: string");
        expect(output).toContain("age?: number");
      }
    });

    it("should handle enum types", async () => {
      const schema = JSON.stringify({
        type: "object",
        properties: {
          status: { type: "string", enum: ["active", "inactive"] },
        },
      });
      const result = await executeTool(jsonSchemaToTypescript, { input: schema });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain('"active"');
        expect(output).toContain('"inactive"');
      }
    });

    it("should handle array types", async () => {
      const schema = JSON.stringify({
        type: "object",
        properties: {
          tags: { type: "array", items: { type: "string" } },
        },
      });
      const result = await executeTool(jsonSchemaToTypescript, { input: schema });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("string[]");
      }
    });

    it("should handle $ref", async () => {
      const schema = JSON.stringify({
        type: "object",
        properties: {
          address: { $ref: "#/$defs/Address" },
        },
        $defs: {
          Address: {
            type: "object",
            properties: { city: { type: "string" } },
          },
        },
      });
      const result = await executeTool(jsonSchemaToTypescript, { input: schema });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Address");
      }
    });

    it("should use custom root name", async () => {
      const schema = JSON.stringify({ type: "string" });
      const result = await executeTool(
        jsonSchemaToTypescript,
        { input: schema },
        { rootName: "MyType" }
      );
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("MyType");
      }
    });

    it("should omit export when option is false", async () => {
      const schema = JSON.stringify({ type: "string" });
      const result = await executeTool(
        jsonSchemaToTypescript,
        { input: schema },
        { exportTypes: false }
      );
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).not.toContain("export ");
      }
    });

    it("should reject empty input", async () => {
      const result = await executeTool(jsonSchemaToTypescript, { input: "" });
      expect(result.success).toBe(false);
    });

    it("should reject invalid JSON", async () => {
      const result = await executeTool(jsonSchemaToTypescript, { input: "bad" });
      expect(result.success).toBe(false);
    });
  });
});
