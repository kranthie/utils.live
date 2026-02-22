import { describe, it, expect } from "vitest";
import { jsonMinify } from "../../../src/tools/json/minify";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

interface MinifyOutput {
  output: string;
  originalSize: number;
  minifiedSize: number;
  reduction: number;
}

describe("jsonMinify", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(jsonMinify.meta.id).toBe("json/minify");
      expect(jsonMinify.meta.name).toBe("JSON Minify");
      expect(jsonMinify.meta.category).toBe("json");
      expect(jsonMinify.meta.tier).toBe(ToolTier.CLIENT);
      expect(jsonMinify.meta.keywords).toContain("json");
      expect(jsonMinify.meta.keywords).toContain("minify");
    });
  });

  describe("execute", () => {
    describe("basic minification", () => {
      it("should remove whitespace from formatted JSON", async () => {
        const result = await executeTool<MinifyOutput>(jsonMinify, {
          input: '{\n  "name": "test",\n  "value": 123\n}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            '{"name":"test","value":123}'
          );
        }
      });

      it("should minify already minified JSON", async () => {
        const result = await executeTool<MinifyOutput>(jsonMinify, {
          input: '{"name":"test"}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            '{"name":"test"}'
          );
        }
      });

      it("should minify arrays", async () => {
        const result = await executeTool<MinifyOutput>(jsonMinify, {
          input: "[\n  1,\n  2,\n  3\n]",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "[1,2,3]"
          );
        }
      });

      it("should minify nested objects", async () => {
        const input = `{
  "outer": {
    "inner": {
      "deep": "value"
    }
  }
}`;
        const result = await executeTool<MinifyOutput>(jsonMinify, { input });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            '{"outer":{"inner":{"deep":"value"}}}'
          );
        }
      });
    });

    describe("size metrics", () => {
      it("should report original size", async () => {
        const input = '{\n  "name": "test"\n}';
        const result = await executeTool<MinifyOutput>(jsonMinify, { input });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).originalSize
          ).toBeGreaterThan(0);
        }
      });

      it("should report minified size", async () => {
        const result = await executeTool<MinifyOutput>(jsonMinify, {
          input: '{\n  "name": "test"\n}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).minifiedSize
          ).toBeGreaterThan(0);
          expect(
            (result.data as Record<string, unknown>).minifiedSize
          ).toBeLessThanOrEqual(
            (result.data as Record<string, unknown>).originalSize
          );
        }
      });

      it("should calculate reduction percentage", async () => {
        const result = await executeTool<MinifyOutput>(jsonMinify, {
          input: '{\n  "name": "test",\n  "value": 123\n}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).reduction
          ).toBeGreaterThan(0);
          expect(
            (result.data as Record<string, unknown>).reduction
          ).toBeLessThanOrEqual(100);
        }
      });

      it("should report 0 reduction for already minified JSON", async () => {
        const result = await executeTool<MinifyOutput>(jsonMinify, {
          input: '{"a":1}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).reduction).toBe(0);
        }
      });

      it("should handle significant reduction correctly", async () => {
        // JSON with lots of whitespace
        const input = `{
          "a": 1,
          "b": 2,
          "c": 3,
          "d": 4,
          "e": 5
        }`;
        const result = await executeTool<MinifyOutput>(jsonMinify, { input });

        expect(result.success).toBe(true);
        if (result.success) {
          // Should have significant reduction
          expect(
            (result.data as Record<string, unknown>).reduction
          ).toBeGreaterThan(50);
        }
      });
    });

    describe("edge cases", () => {
      it("should handle empty object", async () => {
        const result = await executeTool<MinifyOutput>(jsonMinify, {
          input: "{\n}",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe("{}");
        }
      });

      it("should handle empty array", async () => {
        const result = await executeTool<MinifyOutput>(jsonMinify, {
          input: "[\n]",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe("[]");
        }
      });

      it("should handle primitives", async () => {
        const stringResult = await executeTool<MinifyOutput>(jsonMinify, {
          input: '"hello"',
        });
        expect(stringResult.success).toBe(true);
        if (stringResult.success) {
          expect((stringResult.data as Record<string, unknown>).output).toBe(
            '"hello"'
          );
        }

        const numberResult = await executeTool<MinifyOutput>(jsonMinify, {
          input: "42",
        });
        expect(numberResult.success).toBe(true);
        if (numberResult.success) {
          expect((numberResult.data as Record<string, unknown>).output).toBe(
            "42"
          );
        }

        const boolResult = await executeTool<MinifyOutput>(jsonMinify, {
          input: "true",
        });
        expect(boolResult.success).toBe(true);
        if (boolResult.success) {
          expect((boolResult.data as Record<string, unknown>).output).toBe(
            "true"
          );
        }

        const nullResult = await executeTool<MinifyOutput>(jsonMinify, {
          input: "null",
        });
        expect(nullResult.success).toBe(true);
        if (nullResult.success) {
          expect((nullResult.data as Record<string, unknown>).output).toBe(
            "null"
          );
        }
      });

      it("should preserve strings with whitespace", async () => {
        const result = await executeTool<MinifyOutput>(jsonMinify, {
          input: '{"text": "hello   world"}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            '{"text":"hello   world"}'
          );
        }
      });

      it("should handle special characters in strings", async () => {
        const result = await executeTool<MinifyOutput>(jsonMinify, {
          input: '{\n  "text": "line1\\nline2"\n}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            '{"text":"line1\\nline2"}'
          );
        }
      });

      it("should handle unicode characters", async () => {
        const result = await executeTool<MinifyOutput>(jsonMinify, {
          input: '{\n  "emoji": "\\u0048\\u0065\\u006c\\u006c\\u006f"\n}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const parsed = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as { emoji: string };
          expect(parsed.emoji).toBe("Hello");
        }
      });

      it("should handle large JSON", async () => {
        const largeObject = {
          items: Array.from({ length: 1000 }, (_, i) => ({
            id: i,
            name: `Item ${i}`,
          })),
        };
        const input = JSON.stringify(largeObject, null, 2);

        const result = await executeTool<MinifyOutput>(jsonMinify, { input });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).reduction
          ).toBeGreaterThan(0);
          // Verify output is valid JSON
          expect(() => {
            JSON.parse((result.data as Record<string, unknown>).output);
          }).not.toThrow();
        }
      });
    });

    describe("error handling", () => {
      it("should return error for invalid JSON", async () => {
        const result = await executeTool<MinifyOutput>(jsonMinify, {
          input: "{invalid}",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("JSON_PARSE_ERROR");
        }
      });

      it("should return error for empty input", async () => {
        const result = await executeTool<MinifyOutput>(jsonMinify, {
          input: "",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("JSON_PARSE_ERROR");
        }
      });

      it("should return error for missing input", async () => {
        const result = await executeTool<MinifyOutput>(jsonMinify, {});

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("INPUT_INVALID_TYPE");
        }
      });
    });
  });
});
