import { describe, it, expect } from "vitest";
import { jsonToCsharp } from "../../../src/tools/json/json-to-csharp";
import { executeTool } from "../../../src/core/executor";

describe("jsonToCsharp", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(jsonToCsharp.meta.id).toBe("json/json-to-csharp");
      expect(jsonToCsharp.meta.category).toBe("json");
    });
  });

  describe("execute", () => {
    it("should generate C# class from simple JSON", async () => {
      const result = await executeTool(jsonToCsharp, {
        input: '{"name": "John", "age": 30, "active": true}',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("public class Root");
        expect(output).toContain("string Name");
        expect(output).toContain("int Age");
        expect(output).toContain("bool Active");
      }
    });

    it("should generate record types when useRecord is true", async () => {
      const result = await executeTool(
        jsonToCsharp,
        { input: '{"name": "John"}' },
        { useRecord: true }
      );
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("public record Root");
      }
    });

    it("should include JsonPropertyName attributes", async () => {
      const result = await executeTool(jsonToCsharp, {
        input: '{"first_name": "John"}',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain('[JsonPropertyName("first_name")]');
      }
    });

    it("should use custom namespace", async () => {
      const result = await executeTool(
        jsonToCsharp,
        { input: '{"x": 1}' },
        { namespace: "My.Custom.Namespace" }
      );
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("namespace My.Custom.Namespace");
      }
    });

    it("should handle arrays of objects", async () => {
      const result = await executeTool(jsonToCsharp, {
        input: '[{"id": 1, "name": "A"}, {"id": 2, "name": "B"}]',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("public class Root");
      }
    });

    it("should handle nested objects", async () => {
      const result = await executeTool(jsonToCsharp, {
        input: '{"user": {"name": "John"}}',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("User");
      }
    });

    it("should handle primitive JSON", async () => {
      const result = await executeTool(jsonToCsharp, { input: '"hello"' });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("primitive");
      }
    });

    it("should reject empty input", async () => {
      const result = await executeTool(jsonToCsharp, { input: "" });
      expect(result.success).toBe(false);
    });
  });
});
