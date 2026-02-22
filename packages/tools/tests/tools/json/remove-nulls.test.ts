import { describe, it, expect } from "vitest";
import { jsonRemoveNulls } from "../../../src/tools/json/remove-nulls";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

interface RemoveNullsOutput {
  output: string;
  removedCount: number;
}

describe("jsonRemoveNulls", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(jsonRemoveNulls.meta.id).toBe("json/remove-nulls");
      expect(jsonRemoveNulls.meta.name).toBe("JSON Remove Nulls");
      expect(jsonRemoveNulls.meta.category).toBe("json");
      expect(jsonRemoveNulls.meta.tier).toBe(ToolTier.CLIENT);
      expect(jsonRemoveNulls.meta.keywords).toContain("json");
      expect(jsonRemoveNulls.meta.keywords).toContain("null");
      expect(jsonRemoveNulls.meta.keywords).toContain("remove");
    });
  });

  describe("execute", () => {
    describe("null removal", () => {
      it("should remove null values from object", async () => {
        const result = await executeTool<RemoveNullsOutput>(jsonRemoveNulls, {
          input: '{"a": 1, "b": null, "c": 3}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(output).toEqual({ a: 1, c: 3 });
          expect((result.data as Record<string, unknown>).removedCount).toBe(1);
        }
      });

      it("should remove null values from nested objects", async () => {
        const result = await executeTool<RemoveNullsOutput>(jsonRemoveNulls, {
          input: '{"user": {"name": "John", "middle": null, "age": 30}}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(output.user).toEqual({ name: "John", age: 30 });
        }
      });

      it("should remove null values from arrays", async () => {
        const result = await executeTool<RemoveNullsOutput>(jsonRemoveNulls, {
          input: "[1, null, 2, null, 3]",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(output).toEqual([1, 2, 3]);
          expect((result.data as Record<string, unknown>).removedCount).toBe(2);
        }
      });

      it("should remove null values from nested arrays", async () => {
        const result = await executeTool<RemoveNullsOutput>(jsonRemoveNulls, {
          input: '{"items": [1, null, {"value": null, "id": 1}]}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(output.items).toEqual([1, { id: 1 }]);
        }
      });

      it("should handle deeply nested nulls", async () => {
        const result = await executeTool<RemoveNullsOutput>(jsonRemoveNulls, {
          input: '{"a": {"b": {"c": null, "d": 1}}}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect((output.a as Record<string, unknown>).b).toEqual({ d: 1 });
        }
      });
    });

    describe("removeEmptyStrings option", () => {
      it("should not remove empty strings by default", async () => {
        const result = await executeTool<RemoveNullsOutput>(jsonRemoveNulls, {
          input: '{"a": "", "b": "hello"}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(output).toEqual({ a: "", b: "hello" });
        }
      });

      it("should remove empty strings when option is true", async () => {
        const result = await executeTool<RemoveNullsOutput>(
          jsonRemoveNulls,
          { input: '{"a": "", "b": "hello"}' },
          { removeEmptyStrings: true }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(output).toEqual({ b: "hello" });
          expect((result.data as Record<string, unknown>).removedCount).toBe(1);
        }
      });
    });

    describe("removeEmptyArrays option", () => {
      it("should not remove empty arrays by default", async () => {
        const result = await executeTool<RemoveNullsOutput>(jsonRemoveNulls, {
          input: '{"items": [], "name": "test"}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(output).toEqual({ items: [], name: "test" });
        }
      });

      it("should remove empty arrays when option is true", async () => {
        const result = await executeTool<RemoveNullsOutput>(
          jsonRemoveNulls,
          { input: '{"items": [], "name": "test"}' },
          { removeEmptyArrays: true }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(output).toEqual({ name: "test" });
          expect((result.data as Record<string, unknown>).removedCount).toBe(1);
        }
      });

      it("should remove arrays that become empty after null removal", async () => {
        const result = await executeTool<RemoveNullsOutput>(
          jsonRemoveNulls,
          { input: '{"items": [null, null], "name": "test"}' },
          { removeEmptyArrays: true }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(output).toEqual({ name: "test" });
        }
      });
    });

    describe("removeEmptyObjects option", () => {
      it("should not remove empty objects by default", async () => {
        const result = await executeTool<RemoveNullsOutput>(jsonRemoveNulls, {
          input: '{"user": {}, "name": "test"}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(output).toEqual({ user: {}, name: "test" });
        }
      });

      it("should remove empty objects when option is true", async () => {
        const result = await executeTool<RemoveNullsOutput>(
          jsonRemoveNulls,
          { input: '{"user": {}, "name": "test"}' },
          { removeEmptyObjects: true }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(output).toEqual({ name: "test" });
          expect((result.data as Record<string, unknown>).removedCount).toBe(1);
        }
      });

      it("should remove objects that become empty after null removal", async () => {
        const result = await executeTool<RemoveNullsOutput>(
          jsonRemoveNulls,
          { input: '{"user": {"name": null}, "id": 1}' },
          { removeEmptyObjects: true }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(output).toEqual({ id: 1 });
        }
      });
    });

    describe("combined options", () => {
      it("should remove all empty values when all options are true", async () => {
        const result = await executeTool<RemoveNullsOutput>(
          jsonRemoveNulls,
          { input: '{"a": null, "b": "", "c": [], "d": {}, "e": "keep"}' },
          {
            removeEmptyStrings: true,
            removeEmptyArrays: true,
            removeEmptyObjects: true,
          }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(output).toEqual({ e: "keep" });
          expect((result.data as Record<string, unknown>).removedCount).toBe(4);
        }
      });
    });

    describe("indent option", () => {
      it("should use custom indent", async () => {
        const result = await executeTool<RemoveNullsOutput>(
          jsonRemoveNulls,
          { input: '{"a": 1, "b": null}' },
          { indent: 4 }
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
      it("should handle empty object", async () => {
        const result = await executeTool<RemoveNullsOutput>(jsonRemoveNulls, {
          input: "{}",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(output).toEqual({});
          expect((result.data as Record<string, unknown>).removedCount).toBe(0);
        }
      });

      it("should handle empty array", async () => {
        const result = await executeTool<RemoveNullsOutput>(jsonRemoveNulls, {
          input: "[]",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(output).toEqual([]);
          expect((result.data as Record<string, unknown>).removedCount).toBe(0);
        }
      });

      it("should handle object with only null values", async () => {
        const result = await executeTool<RemoveNullsOutput>(jsonRemoveNulls, {
          input: '{"a": null, "b": null}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(output).toEqual({});
          expect((result.data as Record<string, unknown>).removedCount).toBe(2);
        }
      });

      it("should handle array with only null values", async () => {
        const result = await executeTool<RemoveNullsOutput>(jsonRemoveNulls, {
          input: "[null, null, null]",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(output).toEqual([]);
          expect((result.data as Record<string, unknown>).removedCount).toBe(3);
        }
      });

      it("should preserve non-null values", async () => {
        const result = await executeTool<RemoveNullsOutput>(jsonRemoveNulls, {
          input: '{"str": "hello", "num": 0, "bool": false}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(output).toEqual({ str: "hello", num: 0, bool: false });
          expect((result.data as Record<string, unknown>).removedCount).toBe(0);
        }
      });

      it("should handle null as root value", async () => {
        const result = await executeTool<RemoveNullsOutput>(jsonRemoveNulls, {
          input: "null",
        });

        expect(result.success).toBe(true);
        // The root itself becomes undefined, which stringifies as undefined
      });
    });

    describe("error handling", () => {
      it("should return error for invalid JSON", async () => {
        const result = await executeTool<RemoveNullsOutput>(jsonRemoveNulls, {
          input: "{invalid}",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("JSON_PARSE_ERROR");
        }
      });

      it("should return error for missing input", async () => {
        const result = await executeTool<RemoveNullsOutput>(
          jsonRemoveNulls,
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
