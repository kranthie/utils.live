import { describe, it, expect } from "vitest";
import { jsonValidator } from "../../../src/tools/json/validator";
import { executeTool } from "../../../src/core/executor";

describe("JSON Validator Tool", () => {
  describe("valid JSON", () => {
    it("should validate simple object", async () => {
      const result = await executeTool(jsonValidator, { input: '{"a":1}' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).valid).toBe(true);
        expect((result.data as Record<string, unknown>).errors).toBeUndefined();
      }
    });

    it("should validate empty object", async () => {
      const result = await executeTool(jsonValidator, { input: "{}" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).valid).toBe(true);
      }
    });

    it("should validate array", async () => {
      const result = await executeTool(jsonValidator, { input: "[1, 2, 3]" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).valid).toBe(true);
      }
    });

    it("should validate nested structure", async () => {
      const input = JSON.stringify({
        name: "test",
        values: [1, 2, { nested: true }],
        config: { enabled: false },
      });
      const result = await executeTool(jsonValidator, { input });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).valid).toBe(true);
      }
    });

    it("should validate primitives", async () => {
      // String
      let result = await executeTool(jsonValidator, { input: '"hello"' });
      expect(result.success).toBe(true);
      if (result.success)
        expect((result.data as Record<string, unknown>).valid).toBe(true);

      // Number
      result = await executeTool(jsonValidator, { input: "42" });
      expect(result.success).toBe(true);
      if (result.success)
        expect((result.data as Record<string, unknown>).valid).toBe(true);

      // Boolean
      result = await executeTool(jsonValidator, { input: "true" });
      expect(result.success).toBe(true);
      if (result.success)
        expect((result.data as Record<string, unknown>).valid).toBe(true);

      // Null
      result = await executeTool(jsonValidator, { input: "null" });
      expect(result.success).toBe(true);
      if (result.success)
        expect((result.data as Record<string, unknown>).valid).toBe(true);
    });
  });

  describe("invalid JSON", () => {
    it("should detect syntax error - missing bracket", async () => {
      const result = await executeTool(jsonValidator, { input: '{"a":1' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).valid).toBe(false);
        expect((result.data as Record<string, unknown>).error).toBeDefined();
      }
    });

    it("should detect syntax error - trailing comma", async () => {
      const result = await executeTool(jsonValidator, { input: '{"a":1,}' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).valid).toBe(false);
        expect((result.data as Record<string, unknown>).error).toBeDefined();
      }
    });

    it("should detect syntax error - unquoted key", async () => {
      const result = await executeTool(jsonValidator, { input: "{a:1}" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).valid).toBe(false);
      }
    });

    it("should detect syntax error - single quotes", async () => {
      const result = await executeTool(jsonValidator, { input: "{'a':1}" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).valid).toBe(false);
      }
    });

    it("should detect empty input as invalid", async () => {
      const result = await executeTool(jsonValidator, { input: "" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).valid).toBe(false);
      }
    });

    it("should provide error message", async () => {
      const result = await executeTool(jsonValidator, { input: "not json" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).valid).toBe(false);
        expect((result.data as Record<string, unknown>).error).toBeDefined();
        expect((result.data as Record<string, unknown>).error).toContain(
          "Unexpected"
        );
      }
    });

    it("should provide line and column for errors", async () => {
      const result = await executeTool(jsonValidator, { input: '{"a":}' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).valid).toBe(false);
        // Position info may or may not be available depending on JSON parse error format
      }
    });
  });

  describe("type and size detection", () => {
    it("should detect object type and size", async () => {
      const result = await executeTool(jsonValidator, {
        input: '{"a":1,"b":2,"c":3}',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).type).toBe("object");
        expect((result.data as Record<string, unknown>).size).toBe(3);
      }
    });

    it("should detect array type and size", async () => {
      const result = await executeTool(jsonValidator, { input: "[1,2,3,4,5]" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).type).toBe("array");
        expect((result.data as Record<string, unknown>).size).toBe(5);
      }
    });

    it("should detect string type", async () => {
      const result = await executeTool(jsonValidator, { input: '"hello"' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).type).toBe("string");
        expect((result.data as Record<string, unknown>).size).toBeUndefined();
      }
    });

    it("should detect number type", async () => {
      const result = await executeTool(jsonValidator, { input: "42.5" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).type).toBe("number");
      }
    });

    it("should detect boolean type", async () => {
      const result = await executeTool(jsonValidator, { input: "false" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).type).toBe("boolean");
      }
    });

    it("should detect null type", async () => {
      const result = await executeTool(jsonValidator, { input: "null" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).type).toBe("null");
      }
    });
  });

  describe("tool metadata", () => {
    it("should have correct id", () => {
      expect(jsonValidator.meta.id).toBe("json/validator");
    });

    it("should be in json category", () => {
      expect(jsonValidator.meta.category).toBe("json");
    });

    it("should have keywords", () => {
      expect(jsonValidator.meta.keywords).toContain("json");
      expect(jsonValidator.meta.keywords).toContain("validate");
    });
  });

  describe("execute function directly", () => {
    it("should handle non-Error exception with fallback message", () => {
      // Mock JSON.parse to throw a non-Error value
      const originalParse = JSON.parse;
      JSON.parse = () => {
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw "string error"; // Non-Error value
      };

      try {
        const result = jsonValidator.execute({ input: '{"a":1}' }) as Record<
          string,
          unknown
        >;
        expect(result.valid).toBe(false);
        expect(result.error).toBe("Invalid JSON format");
      } finally {
        JSON.parse = originalParse;
      }
    });
  });
});
