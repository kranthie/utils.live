import { describe, it, expect } from "vitest";
import { jsonToTypescript } from "../../../src/tools/json/json-to-typescript";
import { executeTool } from "../../../src/core/executor";

describe("jsonToTypescript", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(jsonToTypescript.meta.id).toBe("json/json-to-typescript");
      expect(jsonToTypescript.meta.category).toBe("json");
    });
  });

  describe("execute", () => {
    it("should generate interface from simple JSON", async () => {
      const result = await executeTool(jsonToTypescript, {
        input: '{"name": "John", "age": 30, "active": true}',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("export interface Root");
        expect(output).toContain("name: string");
        expect(output).toContain("age: number");
        expect(output).toContain("active: boolean");
      }
    });

    it("should handle optional fields", async () => {
      const result = await executeTool(
        jsonToTypescript,
        { input: '{"name": "John"}' },
        { optionalFields: true }
      );
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("name?:");
      }
    });

    it("should handle readonly fields", async () => {
      const result = await executeTool(
        jsonToTypescript,
        { input: '{"name": "John"}' },
        { readonlyFields: true }
      );
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("readonly name:");
      }
    });

    it("should use type instead of interface", async () => {
      const result = await executeTool(
        jsonToTypescript,
        { input: '{"name": "John"}' },
        { useType: true }
      );
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("export type Root");
      }
    });

    it("should handle arrays of objects", async () => {
      const result = await executeTool(jsonToTypescript, {
        input: '[{"id": 1, "name": "A"}, {"id": 2, "name": "B"}]',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("interface Root");
      }
    });

    it("should handle nested objects", async () => {
      const result = await executeTool(jsonToTypescript, {
        input: '{"address": {"city": "NYC", "zip": "10001"}}',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Address");
      }
    });

    it("should handle null values", async () => {
      const result = await executeTool(jsonToTypescript, {
        input: '{"value": null}',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("null");
      }
    });

    it("should handle primitive JSON", async () => {
      const result = await executeTool(jsonToTypescript, { input: "42" });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("number");
      }
    });

    it("should omit export when disabled", async () => {
      const result = await executeTool(
        jsonToTypescript,
        { input: '{"x": 1}' },
        { exportTypes: false }
      );
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).not.toContain("export ");
      }
    });

    it("should reject empty input", async () => {
      const result = await executeTool(jsonToTypescript, { input: "" });
      expect(result.success).toBe(false);
    });
  });
});
