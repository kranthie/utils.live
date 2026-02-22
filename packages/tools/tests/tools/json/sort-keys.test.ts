import { describe, it, expect } from "vitest";
import { jsonSortKeys } from "../../../src/tools/json/sort-keys";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

interface SortKeysOutput {
  output: string;
}

describe("jsonSortKeys", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(jsonSortKeys.meta.id).toBe("json/sort-keys");
      expect(jsonSortKeys.meta.name).toBe("JSON Sort Keys");
      expect(jsonSortKeys.meta.category).toBe("json");
      expect(jsonSortKeys.meta.tier).toBe(ToolTier.CLIENT);
      expect(jsonSortKeys.meta.keywords).toContain("json");
      expect(jsonSortKeys.meta.keywords).toContain("sort");
      expect(jsonSortKeys.meta.keywords).toContain("keys");
    });
  });

  describe("execute", () => {
    describe("ascending order (default)", () => {
      it("should sort keys alphabetically", async () => {
        const result = await executeTool<SortKeysOutput>(jsonSortKeys, {
          input: '{"z": 1, "a": 2, "m": 3}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          const keys = Object.keys(output);
          expect(keys).toEqual(["a", "m", "z"]);
        }
      });

      it("should sort nested object keys", async () => {
        const result = await executeTool<SortKeysOutput>(jsonSortKeys, {
          input: '{"z": {"b": 1, "a": 2}, "y": 3}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(Object.keys(output)).toEqual(["y", "z"]);
          expect(Object.keys(output.z as object)).toEqual(["a", "b"]);
        }
      });

      it("should sort keys in objects within arrays", async () => {
        const result = await executeTool<SortKeysOutput>(jsonSortKeys, {
          input: '[{"z": 1, "a": 2}, {"b": 3, "a": 4}]',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(Object.keys(output[0] as object)).toEqual(["a", "z"]);
          expect(Object.keys(output[1] as object)).toEqual(["a", "b"]);
        }
      });

      it("should handle deeply nested objects", async () => {
        const result = await executeTool<SortKeysOutput>(jsonSortKeys, {
          input: '{"z": {"y": {"x": 1, "a": 2}}}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as {
            z: { y: Record<string, unknown> };
          };
          expect(Object.keys(output.z.y)).toEqual(["a", "x"]);
        }
      });
    });

    describe("descending order", () => {
      it("should sort keys in descending order", async () => {
        const result = await executeTool<SortKeysOutput>(
          jsonSortKeys,
          { input: '{"a": 1, "m": 2, "z": 3}' },
          { order: "desc" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          const keys = Object.keys(output);
          expect(keys).toEqual(["z", "m", "a"]);
        }
      });

      it("should sort nested keys in descending order", async () => {
        const result = await executeTool<SortKeysOutput>(
          jsonSortKeys,
          { input: '{"a": {"x": 1, "y": 2}}' },
          { order: "desc" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(Object.keys(output.a as object)).toEqual(["y", "x"]);
        }
      });
    });

    describe("deep option", () => {
      it("should sort only top-level keys when deep is false", async () => {
        const result = await executeTool<SortKeysOutput>(
          jsonSortKeys,
          { input: '{"z": {"b": 1, "a": 2}, "a": 3}' },
          { deep: false }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(Object.keys(output)).toEqual(["a", "z"]);
          // Nested object should retain original order
          expect(Object.keys(output.z as object)).toEqual(["b", "a"]);
        }
      });

      it("should sort all levels when deep is true (default)", async () => {
        const result = await executeTool<SortKeysOutput>(jsonSortKeys, {
          input: '{"z": {"b": 1, "a": 2}, "a": 3}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(Object.keys(output)).toEqual(["a", "z"]);
          expect(Object.keys(output.z as object)).toEqual(["a", "b"]);
        }
      });

      it("should not modify arrays when deep is false", async () => {
        const result = await executeTool<SortKeysOutput>(
          jsonSortKeys,
          { input: '[{"z": 1, "a": 2}]' },
          { deep: false }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          // Array items should not be sorted
          expect(Object.keys(output[0] as object)).toEqual(["z", "a"]);
        }
      });
    });

    describe("indent option", () => {
      it("should use custom indent", async () => {
        const result = await executeTool<SortKeysOutput>(
          jsonSortKeys,
          { input: '{"b": 1, "a": 2}' },
          { indent: 4 }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "    "
          );
        }
      });

      it("should use 0 indent for minified output", async () => {
        const result = await executeTool<SortKeysOutput>(
          jsonSortKeys,
          { input: '{"b": 1, "a": 2}' },
          { indent: 0 }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).not.toContain(
            "\n"
          );
        }
      });
    });

    describe("edge cases", () => {
      it("should handle empty object", async () => {
        const result = await executeTool<SortKeysOutput>(jsonSortKeys, {
          input: "{}",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            JSON.parse((result.data as Record<string, unknown>).output)
          ).toEqual({});
        }
      });

      it("should handle single key object", async () => {
        const result = await executeTool<SortKeysOutput>(jsonSortKeys, {
          input: '{"only": 1}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            JSON.parse((result.data as Record<string, unknown>).output)
          ).toEqual({ only: 1 });
        }
      });

      it("should preserve array order", async () => {
        const result = await executeTool<SortKeysOutput>(jsonSortKeys, {
          input: "[3, 1, 2]",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            JSON.parse((result.data as Record<string, unknown>).output)
          ).toEqual([3, 1, 2]);
        }
      });

      it("should handle null values", async () => {
        const result = await executeTool<SortKeysOutput>(jsonSortKeys, {
          input: '{"z": null, "a": 1}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(Object.keys(output)).toEqual(["a", "z"]);
          expect(output.z).toBeNull();
        }
      });

      it("should handle numeric-like keys", async () => {
        const result = await executeTool<SortKeysOutput>(jsonSortKeys, {
          input: '{"10": "a", "2": "b", "1": "c"}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          // Sorted using localeCompare (which may order numbers naturally)
          const keys = Object.keys(output);
          expect(keys.length).toBe(3);
          expect(keys).toContain("1");
          expect(keys).toContain("2");
          expect(keys).toContain("10");
        }
      });

      it("should handle special characters in keys", async () => {
        const result = await executeTool<SortKeysOutput>(jsonSortKeys, {
          input: '{"z-key": 1, "a.key": 2, "m key": 3}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          const keys = Object.keys(output);
          // Should be sorted alphabetically
          expect(keys[0]).toBe("a.key");
        }
      });

      it("should handle unicode keys", async () => {
        const result = await executeTool<SortKeysOutput>(jsonSortKeys, {
          input: '{"": 1, "apple": 2, "": 3}',
        });

        expect(result.success).toBe(true);
      });

      it("should handle primitives at root", async () => {
        const stringResult = await executeTool<SortKeysOutput>(jsonSortKeys, {
          input: '"hello"',
        });
        expect(stringResult.success).toBe(true);
        if (stringResult.success) {
          expect(
            JSON.parse((stringResult.data as Record<string, unknown>).output)
          ).toBe("hello");
        }

        const nullResult = await executeTool<SortKeysOutput>(jsonSortKeys, {
          input: "null",
        });
        expect(nullResult.success).toBe(true);
        if (nullResult.success) {
          expect(
            JSON.parse((nullResult.data as Record<string, unknown>).output)
          ).toBeNull();
        }
      });
    });

    describe("error handling", () => {
      it("should return error for invalid JSON", async () => {
        const result = await executeTool<SortKeysOutput>(jsonSortKeys, {
          input: "{invalid}",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("JSON_PARSE_ERROR");
        }
      });

      it("should return error for missing input", async () => {
        const result = await executeTool<SortKeysOutput>(jsonSortKeys, {});

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("INPUT_INVALID_TYPE");
        }
      });
    });
  });
});
