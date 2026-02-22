import { describe, it, expect } from "vitest";
import { jsonMerge } from "../../../src/tools/json/merge";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

interface MergeOutput {
  output: string;
}

describe("jsonMerge", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(jsonMerge.meta.id).toBe("json/merge");
      expect(jsonMerge.meta.name).toBe("JSON Merge");
      expect(jsonMerge.meta.category).toBe("json");
      expect(jsonMerge.meta.tier).toBe(ToolTier.CLIENT);
      expect(jsonMerge.meta.keywords).toContain("json");
      expect(jsonMerge.meta.keywords).toContain("merge");
    });
  });

  describe("execute", () => {
    describe("shallow merge", () => {
      it("should merge flat objects", async () => {
        const result = await executeTool<MergeOutput>(
          jsonMerge,
          { input: '{"a": 1, "b": 2}' },
          { second: '{"c": 3, "d": 4}', deep: false }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(output).toEqual({ a: 1, b: 2, c: 3, d: 4 });
        }
      });

      it("should override values in shallow merge", async () => {
        const result = await executeTool<MergeOutput>(
          jsonMerge,
          { input: '{"a": 1, "b": 2}' },
          { second: '{"b": 5, "c": 3}', deep: false }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as { b: number };
          expect(output.b).toBe(5);
        }
      });

      it("should replace nested objects in shallow merge", async () => {
        const result = await executeTool<MergeOutput>(
          jsonMerge,
          { input: '{"nested": {"a": 1, "b": 2}}' },
          { second: '{"nested": {"c": 3}}', deep: false }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as {
            nested: Record<string, unknown>;
          };
          expect(output.nested).toEqual({ c: 3 });
        }
      });
    });

    describe("deep merge (default)", () => {
      it("should deep merge nested objects", async () => {
        const result = await executeTool<MergeOutput>(
          jsonMerge,
          { input: '{"nested": {"a": 1, "b": 2}}' },
          { second: '{"nested": {"c": 3}}' }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(output.nested).toEqual({ a: 1, b: 2, c: 3 });
        }
      });

      it("should deep merge multiple levels", async () => {
        const result = await executeTool<MergeOutput>(
          jsonMerge,
          { input: '{"a": {"b": {"c": 1}}}' },
          { second: '{"a": {"b": {"d": 2}}}' }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect((output.a as Record<string, unknown>).b).toEqual({
            c: 1,
            d: 2,
          });
        }
      });

      it("should override primitive values in deep merge", async () => {
        const result = await executeTool<MergeOutput>(
          jsonMerge,
          { input: '{"a": {"b": 1}}' },
          { second: '{"a": {"b": 2}}' }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect((output.a as Record<string, unknown>).b).toBe(2);
        }
      });
    });

    describe("array strategies", () => {
      it("should replace arrays by default", async () => {
        const result = await executeTool<MergeOutput>(
          jsonMerge,
          { input: '{"arr": [1, 2, 3]}' },
          { second: '{"arr": [4, 5]}' }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(output.arr).toEqual([4, 5]);
        }
      });

      it("should concat arrays when strategy is concat", async () => {
        const result = await executeTool<MergeOutput>(
          jsonMerge,
          { input: '{"arr": [1, 2, 3]}' },
          { second: '{"arr": [4, 5]}', arrayStrategy: "concat" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(output.arr).toEqual([1, 2, 3, 4, 5]);
        }
      });

      it("should create unique arrays when strategy is unique", async () => {
        const result = await executeTool<MergeOutput>(
          jsonMerge,
          { input: '{"arr": [1, 2, 3]}' },
          { second: '{"arr": [2, 3, 4]}', arrayStrategy: "unique" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(output.arr).toEqual([1, 2, 3, 4]);
        }
      });
    });

    describe("null handling", () => {
      it("should handle null in source", async () => {
        const result = await executeTool<MergeOutput>(
          jsonMerge,
          { input: '{"a": 1}' },
          { second: "null" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(output).toEqual({ a: 1 });
        }
      });

      it("should handle null in target", async () => {
        const result = await executeTool<MergeOutput>(
          jsonMerge,
          { input: "null" },
          { second: '{"a": 1}' }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(output).toEqual({ a: 1 });
        }
      });

      it("should handle null property values", async () => {
        const result = await executeTool<MergeOutput>(
          jsonMerge,
          { input: '{"a": null}' },
          { second: '{"b": 2}' }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(output).toEqual({ a: null, b: 2 });
        }
      });
    });

    describe("indent option", () => {
      it("should use custom indent", async () => {
        const result = await executeTool<MergeOutput>(
          jsonMerge,
          { input: '{"a": 1}' },
          { second: '{"b": 2}', indent: 4 }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "    "
          );
        }
      });
    });

    describe("edge cases", () => {
      it("should handle empty objects", async () => {
        const result = await executeTool<MergeOutput>(
          jsonMerge,
          { input: "{}" },
          { second: "{}" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(output).toEqual({});
        }
      });

      it("should merge empty with non-empty", async () => {
        const result = await executeTool<MergeOutput>(
          jsonMerge,
          { input: "{}" },
          { second: '{"a": 1}' }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(output).toEqual({ a: 1 });
        }
      });

      it("should handle primitive merging", async () => {
        const result = await executeTool<MergeOutput>(
          jsonMerge,
          { input: "1" },
          { second: "2" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(output).toBe(2);
        }
      });

      it("should handle string merging", async () => {
        const result = await executeTool<MergeOutput>(
          jsonMerge,
          { input: '"hello"' },
          { second: '"world"' }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(output).toBe("world");
        }
      });

      it("should handle complex nested arrays in objects", async () => {
        const result = await executeTool<MergeOutput>(
          jsonMerge,
          { input: '{"users": [{"name": "John"}]}' },
          { second: '{"users": [{"name": "Jane"}]}', arrayStrategy: "concat" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(output.users).toHaveLength(2);
        }
      });

      it("should use default empty object when second is omitted", async () => {
        const result = await executeTool<MergeOutput>(jsonMerge, {
          input: '{"a": 1}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(output).toEqual({ a: 1 });
        }
      });
    });

    describe("error handling", () => {
      it("should return error for invalid first JSON", async () => {
        const result = await executeTool<MergeOutput>(
          jsonMerge,
          { input: "{invalid}" },
          { second: "{}" }
        );

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("JSON_PARSE_ERROR");
          expect(result.error.message).toContain("first");
        }
      });

      it("should return error for invalid second JSON", async () => {
        const result = await executeTool<MergeOutput>(
          jsonMerge,
          { input: "{}" },
          { second: "{invalid}" }
        );

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("JSON_PARSE_ERROR");
          expect(result.error.message).toContain("second");
        }
      });

      it("should return error for missing input", async () => {
        const result = await executeTool<MergeOutput>(
          jsonMerge,
          {},
          { second: "{}" }
        );

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("INPUT_INVALID_TYPE");
        }
      });
    });
  });
});
