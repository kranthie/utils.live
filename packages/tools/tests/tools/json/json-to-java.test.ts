import { describe, it, expect } from "vitest";
import { jsonToJava } from "../../../src/tools/json/json-to-java";
import { executeTool } from "../../../src/core/executor";

describe("jsonToJava", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(jsonToJava.meta.id).toBe("json/json-to-java");
      expect(jsonToJava.meta.category).toBe("json");
    });
  });

  describe("execute", () => {
    it("should generate Java POJO from simple JSON", async () => {
      const result = await executeTool(jsonToJava, {
        input: '{"name": "John", "age": 30}',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("public class Root");
        expect(output).toContain("private String name");
        expect(output).toContain("private Integer age");
        expect(output).toContain("getName");
        expect(output).toContain("setName");
      }
    });

    it("should include Jackson annotations by default", async () => {
      const result = await executeTool(jsonToJava, {
        input: '{"first_name": "John"}',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("@JsonProperty");
        expect(output).toContain("import com.fasterxml.jackson");
      }
    });

    it("should use Lombok when enabled", async () => {
      const result = await executeTool(
        jsonToJava,
        { input: '{"name": "John"}' },
        { useLombok: true }
      );
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("@Data");
        expect(output).toContain("import lombok.Data");
      }
    });

    it("should use custom package name", async () => {
      const result = await executeTool(
        jsonToJava,
        { input: '{"x": 1}' },
        { packageName: "com.test.models" }
      );
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("package com.test.models");
      }
    });

    it("should handle arrays", async () => {
      const result = await executeTool(jsonToJava, {
        input: '{"items": [1, 2, 3]}',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("List<Integer>");
      }
    });

    it("should handle primitives", async () => {
      const result = await executeTool(jsonToJava, { input: '"hello"' });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("primitive");
      }
    });

    it("should reject empty input", async () => {
      const result = await executeTool(jsonToJava, { input: "" });
      expect(result.success).toBe(false);
    });
  });
});
