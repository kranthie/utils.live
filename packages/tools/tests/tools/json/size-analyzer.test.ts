import { describe, it, expect } from "vitest";
import { jsonSizeAnalyzer } from "../../../src/tools/json/size-analyzer";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

interface SizeAnalyzerOutput {
  totalSize: number;
  minifiedSize: number;
  keyCount: number;
  valueCount: number;
  depth: number;
  arrayCount: number;
  objectCount: number;
  stringCount: number;
  numberCount: number;
  booleanCount: number;
  nullCount: number;
  largestKeys: Array<{ path: string; size: number }>;
}

describe("jsonSizeAnalyzer", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(jsonSizeAnalyzer.meta.id).toBe("json/size-analyzer");
      expect(jsonSizeAnalyzer.meta.name).toBe("JSON Size Analyzer");
      expect(jsonSizeAnalyzer.meta.category).toBe("json");
      expect(jsonSizeAnalyzer.meta.tier).toBe(ToolTier.CLIENT);
      expect(jsonSizeAnalyzer.meta.keywords).toContain("json");
      expect(jsonSizeAnalyzer.meta.keywords).toContain("size");
      expect(jsonSizeAnalyzer.meta.keywords).toContain("analyze");
    });
  });

  describe("execute", () => {
    describe("size metrics", () => {
      it("should calculate total size", async () => {
        const input = '{"name": "test"}';
        const result = await executeTool<SizeAnalyzerOutput>(jsonSizeAnalyzer, {
          input,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).totalSize
          ).toBeGreaterThan(0);
        }
      });

      it("should calculate minified size", async () => {
        const input = '{\n  "name": "test"\n}';
        const result = await executeTool<SizeAnalyzerOutput>(jsonSizeAnalyzer, {
          input,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).minifiedSize
          ).toBeGreaterThan(0);
          expect(
            (result.data as Record<string, unknown>).minifiedSize
          ).toBeLessThanOrEqual(
            (result.data as Record<string, unknown>).totalSize
          );
        }
      });
    });

    describe("structure counts", () => {
      it("should count keys correctly", async () => {
        const result = await executeTool<SizeAnalyzerOutput>(jsonSizeAnalyzer, {
          input: '{"a": 1, "b": 2, "c": 3}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).keyCount).toBe(3);
        }
      });

      it("should count nested keys", async () => {
        const result = await executeTool<SizeAnalyzerOutput>(jsonSizeAnalyzer, {
          input: '{"a": {"b": {"c": 1}}}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).keyCount).toBe(3);
        }
      });

      it("should count values correctly", async () => {
        const result = await executeTool<SizeAnalyzerOutput>(jsonSizeAnalyzer, {
          input: '{"a": 1, "b": "hello", "c": true}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          // Values include the object itself + 3 primitive values
          expect(
            (result.data as Record<string, unknown>).valueCount
          ).toBeGreaterThanOrEqual(3);
        }
      });

      it("should count arrays", async () => {
        const result = await executeTool<SizeAnalyzerOutput>(jsonSizeAnalyzer, {
          input: '{"arr1": [1, 2], "arr2": [3, 4]}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).arrayCount).toBe(2);
        }
      });

      it("should count objects", async () => {
        const result = await executeTool<SizeAnalyzerOutput>(jsonSizeAnalyzer, {
          input: '{"obj1": {}, "obj2": {"nested": {}}}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          // Root object + obj1 + obj2 + nested
          expect((result.data as Record<string, unknown>).objectCount).toBe(4);
        }
      });

      it("should count strings", async () => {
        const result = await executeTool<SizeAnalyzerOutput>(jsonSizeAnalyzer, {
          input: '{"a": "hello", "b": "world", "c": 123}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).stringCount).toBe(2);
        }
      });

      it("should count numbers", async () => {
        const result = await executeTool<SizeAnalyzerOutput>(jsonSizeAnalyzer, {
          input: '{"a": 1, "b": 2.5, "c": "text"}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).numberCount).toBe(2);
        }
      });

      it("should count booleans", async () => {
        const result = await executeTool<SizeAnalyzerOutput>(jsonSizeAnalyzer, {
          input: '{"a": true, "b": false, "c": "text"}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).booleanCount).toBe(2);
        }
      });

      it("should count nulls", async () => {
        const result = await executeTool<SizeAnalyzerOutput>(jsonSizeAnalyzer, {
          input: '{"a": null, "b": null, "c": "text"}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).nullCount).toBe(2);
        }
      });
    });

    describe("depth calculation", () => {
      it("should calculate depth 0 for flat object", async () => {
        const result = await executeTool<SizeAnalyzerOutput>(jsonSizeAnalyzer, {
          input: '{"a": 1, "b": 2}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).depth
          ).toBeGreaterThanOrEqual(1);
        }
      });

      it("should calculate depth for nested objects", async () => {
        const result = await executeTool<SizeAnalyzerOutput>(jsonSizeAnalyzer, {
          input: '{"a": {"b": {"c": {"d": 1}}}}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).depth
          ).toBeGreaterThanOrEqual(4);
        }
      });

      it("should calculate depth for arrays", async () => {
        const result = await executeTool<SizeAnalyzerOutput>(jsonSizeAnalyzer, {
          input: "[[[1]]]",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).depth
          ).toBeGreaterThanOrEqual(3);
        }
      });
    });

    describe("largest keys", () => {
      it("should identify largest keys by value size", async () => {
        const result = await executeTool<SizeAnalyzerOutput>(jsonSizeAnalyzer, {
          input:
            '{"small": 1, "medium": "hello world", "large": {"a": 1, "b": 2, "c": 3, "d": 4}}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).largestKeys
          ).toBeDefined();
          expect(
            Array.isArray((result.data as Record<string, unknown>).largestKeys)
          ).toBe(true);
        }
      });

      it("should return up to 5 largest keys", async () => {
        const input = {
          key1: "a".repeat(100),
          key2: "b".repeat(200),
          key3: "c".repeat(300),
          key4: "d".repeat(400),
          key5: "e".repeat(500),
          key6: "f".repeat(600),
          key7: "g".repeat(700),
        };

        const result = await executeTool<SizeAnalyzerOutput>(jsonSizeAnalyzer, {
          input: JSON.stringify(input),
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).largestKeys.length
          ).toBeLessThanOrEqual(5);
        }
      });

      it("should sort largest keys by size descending", async () => {
        const input = {
          small: "a",
          large: "a".repeat(1000),
          medium: "a".repeat(100),
        };

        const result = await executeTool<SizeAnalyzerOutput>(jsonSizeAnalyzer, {
          input: JSON.stringify(input),
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const sizes = (
            (result.data as Record<string, unknown>).largestKeys as Record<
              string,
              unknown
            >[]
          ).map((k: Record<string, unknown>) => k.size as number);
          for (let i = 1; i < sizes.length; i++) {
            expect(sizes[i - 1]).toBeGreaterThanOrEqual(sizes[i]);
          }
        }
      });

      it("should include path in largest keys", async () => {
        const result = await executeTool<SizeAnalyzerOutput>(jsonSizeAnalyzer, {
          input: '{"user": {"profile": {"bio": "This is a long bio text"}}}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const paths = (
            (result.data as Record<string, unknown>).largestKeys as Record<
              string,
              unknown
            >[]
          ).map((k: Record<string, unknown>) => k.path as string);
          expect(paths.some((p: string) => p.includes("user"))).toBe(true);
        }
      });
    });

    describe("edge cases", () => {
      it("should handle empty object", async () => {
        const result = await executeTool<SizeAnalyzerOutput>(jsonSizeAnalyzer, {
          input: "{}",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).keyCount).toBe(0);
          expect((result.data as Record<string, unknown>).objectCount).toBe(1);
        }
      });

      it("should handle empty array", async () => {
        const result = await executeTool<SizeAnalyzerOutput>(jsonSizeAnalyzer, {
          input: "[]",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).arrayCount).toBe(1);
        }
      });

      it("should handle primitives at root", async () => {
        const stringResult = await executeTool<SizeAnalyzerOutput>(
          jsonSizeAnalyzer,
          {
            input: '"hello"',
          }
        );
        expect(stringResult.success).toBe(true);
        if (stringResult.success) {
          expect(
            (stringResult.data as Record<string, unknown>).stringCount
          ).toBe(1);
        }

        const numberResult = await executeTool<SizeAnalyzerOutput>(
          jsonSizeAnalyzer,
          {
            input: "42",
          }
        );
        expect(numberResult.success).toBe(true);
        if (numberResult.success) {
          expect(
            (numberResult.data as Record<string, unknown>).numberCount
          ).toBe(1);
        }

        const nullResult = await executeTool<SizeAnalyzerOutput>(
          jsonSizeAnalyzer,
          {
            input: "null",
          }
        );
        expect(nullResult.success).toBe(true);
        if (nullResult.success) {
          expect((nullResult.data as Record<string, unknown>).nullCount).toBe(
            1
          );
        }
      });

      it("should handle large JSON", async () => {
        const largeObject = {
          items: Array.from({ length: 100 }, (_, i) => ({
            id: i,
            name: `Item ${i}`,
            data: { nested: true, values: [1, 2, 3] },
          })),
        };

        const result = await executeTool<SizeAnalyzerOutput>(jsonSizeAnalyzer, {
          input: JSON.stringify(largeObject),
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).arrayCount
          ).toBeGreaterThan(0);
          expect(
            (result.data as Record<string, unknown>).objectCount
          ).toBeGreaterThan(100);
        }
      });

      it("should handle mixed types in arrays", async () => {
        const result = await executeTool<SizeAnalyzerOutput>(jsonSizeAnalyzer, {
          input: '[1, "two", true, null, {"key": "value"}, [1, 2]]',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).numberCount
          ).toBeGreaterThanOrEqual(1);
          expect(
            (result.data as Record<string, unknown>).stringCount
          ).toBeGreaterThanOrEqual(1);
          expect(
            (result.data as Record<string, unknown>).booleanCount
          ).toBeGreaterThanOrEqual(1);
          expect(
            (result.data as Record<string, unknown>).nullCount
          ).toBeGreaterThanOrEqual(1);
        }
      });
    });

    describe("error handling", () => {
      it("should return error for invalid JSON", async () => {
        const result = await executeTool<SizeAnalyzerOutput>(jsonSizeAnalyzer, {
          input: "{invalid}",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("JSON_PARSE_ERROR");
        }
      });

      it("should return error for empty input", async () => {
        const result = await executeTool<SizeAnalyzerOutput>(jsonSizeAnalyzer, {
          input: "",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("JSON_PARSE_ERROR");
        }
      });

      it("should return error for missing input", async () => {
        const result = await executeTool<SizeAnalyzerOutput>(
          jsonSizeAnalyzer,
          {}
        );

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("INPUT_INVALID_TYPE");
        }
      });
    });
  });
});
