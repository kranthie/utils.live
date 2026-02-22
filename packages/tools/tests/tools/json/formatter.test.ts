import { describe, it, expect } from "vitest";
import { jsonFormatter } from "../../../src/tools/json/formatter";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("jsonFormatter", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(jsonFormatter.meta.id).toBe("json/formatter");
      expect(jsonFormatter.meta.name).toBe("JSON Formatter");
      expect(jsonFormatter.meta.category).toBe("json");
      expect(jsonFormatter.meta.tier).toBe(ToolTier.CLIENT);
      expect(jsonFormatter.meta.keywords).toContain("json");
      expect(jsonFormatter.meta.keywords).toContain("format");
    });
  });

  describe("execute", () => {
    it("should format valid JSON with default 2-space indent", async () => {
      const result = await executeTool(jsonFormatter, {
        input: '{"name":"test","value":123}',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          '{\n  "name": "test",\n  "value": 123\n}'
        );
      }
    });

    it("should format nested objects", async () => {
      const result = await executeTool(jsonFormatter, {
        input: '{"outer":{"inner":{"deep":"value"}}}',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const expected = `{
  "outer": {
    "inner": {
      "deep": "value"
    }
  }
}`;
        expect((result.data as Record<string, unknown>).output).toBe(expected);
      }
    });

    it("should format arrays", async () => {
      const result = await executeTool(jsonFormatter, {
        input: "[1,2,3]",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "[\n  1,\n  2,\n  3\n]"
        );
      }
    });

    it("should return error for invalid JSON", async () => {
      const result = await executeTool(jsonFormatter, {
        input: "{invalid json}",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("JSON_PARSE_ERROR");
        expect(result.error.message).toContain("Invalid JSON");
      }
    });

    it("should return error for empty input", async () => {
      const result = await executeTool(jsonFormatter, {
        input: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("JSON_PARSE_ERROR");
      }
    });

    it("should handle primitives", async () => {
      const stringResult = await executeTool(jsonFormatter, {
        input: '"hello"',
      });
      expect(stringResult.success).toBe(true);
      if (stringResult.success) {
        expect((stringResult.data as Record<string, unknown>).output).toBe(
          '"hello"'
        );
      }

      const numberResult = await executeTool(jsonFormatter, {
        input: "42",
      });
      expect(numberResult.success).toBe(true);
      if (numberResult.success) {
        expect((numberResult.data as Record<string, unknown>).output).toBe(
          "42"
        );
      }

      const boolResult = await executeTool(jsonFormatter, {
        input: "true",
      });
      expect(boolResult.success).toBe(true);
      if (boolResult.success) {
        expect((boolResult.data as Record<string, unknown>).output).toBe(
          "true"
        );
      }

      const nullResult = await executeTool(jsonFormatter, {
        input: "null",
      });
      expect(nullResult.success).toBe(true);
      if (nullResult.success) {
        expect((nullResult.data as Record<string, unknown>).output).toBe(
          "null"
        );
      }
    });

    it("should handle already formatted JSON", async () => {
      const formatted = '{\n  "a": 1\n}';
      const result = await executeTool(jsonFormatter, {
        input: formatted,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(formatted);
      }
    });

    it("should complete execution within 300ms for typical input", async () => {
      const largeObject = {
        users: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          name: `User ${i}`,
          email: `user${i}@example.com`,
        })),
      };

      const result = await executeTool(jsonFormatter, {
        input: JSON.stringify(largeObject),
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.meta.executionTimeMs).toBeLessThan(300);
      }
    });
  });

  describe("execute function directly", () => {
    it("should use default indent when options is undefined", () => {
      const result = jsonFormatter.execute(
        { input: '{"a":1}' },
        undefined
      ) as Record<string, unknown>;
      // Default indent is 2
      expect(result.output).toBe('{\n  "a": 1\n}');
    });

    it("should use default sortKeys when options is undefined", () => {
      const result = jsonFormatter.execute(
        { input: '{"b":2,"a":1}' },
        undefined
      ) as Record<string, unknown>;
      // Default sortKeys is false, so order should be preserved
      expect(result.output).toBe('{\n  "b": 2,\n  "a": 1\n}');
    });

    it("should throw error for non-Error exception", () => {
      // Mock JSON.parse to throw a non-Error value
      const originalParse = JSON.parse;
      JSON.parse = () => {
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw "string error"; // Non-Error value
      };

      try {
        expect(() =>
          jsonFormatter.execute({ input: '{"a":1}' }, undefined)
        ).toThrow();
      } finally {
        JSON.parse = originalParse;
      }
    });
  });
});
