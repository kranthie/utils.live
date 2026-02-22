import { describe, it, expect } from "vitest";
import { jsonToGo } from "../../../src/tools/json/json-to-go";
import { executeTool } from "../../../src/core/executor";

describe("jsonToGo", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(jsonToGo.meta.id).toBe("json/json-to-go");
      expect(jsonToGo.meta.category).toBe("json");
    });
  });

  describe("execute", () => {
    it("should generate Go struct from simple JSON", async () => {
      const result = await executeTool(jsonToGo, {
        input: '{"name": "John", "age": 30, "active": true}',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("type Root struct");
        expect(output).toContain("Name string");
        expect(output).toContain("Age int");
        expect(output).toContain("Active bool");
      }
    });

    it("should include json tags by default", async () => {
      const result = await executeTool(jsonToGo, {
        input: '{"name": "test"}',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain('`json:"name"`');
      }
    });

    it("should add omitempty when specified", async () => {
      const result = await executeTool(
        jsonToGo,
        { input: '{"name": "test"}' },
        { omitempty: true }
      );
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain('omitempty');
      }
    });

    it("should omit json tags when disabled", async () => {
      const result = await executeTool(
        jsonToGo,
        { input: '{"name": "test"}' },
        { jsonTags: false }
      );
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).not.toContain("`json:");
      }
    });

    it("should handle nested objects", async () => {
      const result = await executeTool(jsonToGo, {
        input: '{"address": {"city": "NYC", "zip": "10001"}}',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Address");
        expect(output).toContain("City string");
      }
    });

    it("should handle arrays of objects", async () => {
      const result = await executeTool(jsonToGo, {
        input: '[{"id": 1}, {"id": 2}]',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("type Root struct");
      }
    });

    it("should handle null values", async () => {
      const result = await executeTool(jsonToGo, {
        input: '{"value": null}',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("interface{}");
      }
    });

    it("should reject empty input", async () => {
      const result = await executeTool(jsonToGo, { input: "" });
      expect(result.success).toBe(false);
    });
  });
});
