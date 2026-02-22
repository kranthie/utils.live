import { describe, it, expect } from "vitest";
import { jsonFlatten } from "../../../src/tools/json/flatten";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

interface FlattenOutput {
  output: string;
  keyCount: number;
}

describe("jsonFlatten", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(jsonFlatten.meta.id).toBe("json/flatten");
      expect(jsonFlatten.meta.name).toBe("JSON Flatten");
      expect(jsonFlatten.meta.category).toBe("json");
      expect(jsonFlatten.meta.tier).toBe(ToolTier.CLIENT);
      expect(jsonFlatten.meta.keywords).toContain("json");
      expect(jsonFlatten.meta.keywords).toContain("flatten");
    });
  });

  describe("execute", () => {
    describe("basic flattening", () => {
      it("should flatten simple nested object", async () => {
        const result = await executeTool<FlattenOutput>(jsonFlatten, {
          input: '{"a": {"b": {"c": 1}}}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(output["a.b.c"]).toBe(1);
          expect((result.data as Record<string, unknown>).keyCount).toBe(1);
        }
      });

      it("should flatten object with multiple nested keys", async () => {
        const result = await executeTool<FlattenOutput>(jsonFlatten, {
          input: '{"user": {"name": "John", "address": {"city": "NYC"}}}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(output["user.name"]).toBe("John");
          expect(output["user.address.city"]).toBe("NYC");
          expect((result.data as Record<string, unknown>).keyCount).toBe(2);
        }
      });

      it("should handle flat object", async () => {
        const result = await executeTool<FlattenOutput>(jsonFlatten, {
          input: '{"a": 1, "b": 2, "c": 3}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(output["a"]).toBe(1);
          expect(output["b"]).toBe(2);
          expect(output["c"]).toBe(3);
        }
      });
    });

    describe("array flattening", () => {
      it("should flatten arrays with bracket notation by default", async () => {
        const result = await executeTool<FlattenOutput>(jsonFlatten, {
          input: '{"items": [1, 2, 3]}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(output["items[0]"]).toBe(1);
          expect(output["items[1]"]).toBe(2);
          expect(output["items[2]"]).toBe(3);
        }
      });

      it("should flatten nested objects within arrays", async () => {
        const result = await executeTool<FlattenOutput>(jsonFlatten, {
          input: '{"users": [{"name": "John"}, {"name": "Jane"}]}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(output["users[0].name"]).toBe("John");
          expect(output["users[1].name"]).toBe("Jane");
        }
      });

      it("should not flatten arrays when flattenArrays is false", async () => {
        const result = await executeTool<FlattenOutput>(
          jsonFlatten,
          { input: '{"items": [1, 2, 3]}' },
          { flattenArrays: false }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(output["items"]).toEqual([1, 2, 3]);
        }
      });
    });

    describe("custom delimiter", () => {
      it("should use custom delimiter", async () => {
        const result = await executeTool<FlattenOutput>(
          jsonFlatten,
          { input: '{"a": {"b": {"c": 1}}}' },
          { delimiter: "_" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(output["a_b_c"]).toBe(1);
        }
      });

      it("should use multi-character delimiter", async () => {
        const result = await executeTool<FlattenOutput>(
          jsonFlatten,
          { input: '{"a": {"b": 1}}' },
          { delimiter: "->" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(output["a->b"]).toBe(1);
        }
      });
    });

    describe("max depth", () => {
      it("should respect maxDepth option", async () => {
        const result = await executeTool<FlattenOutput>(
          jsonFlatten,
          { input: '{"a": {"b": {"c": {"d": 1}}}}' },
          { maxDepth: 2 }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          // Should stop at depth 2, so a.b should contain the rest as object
          expect(output["a.b"]).toEqual({ c: { d: 1 } });
        }
      });

      it("should flatten completely when maxDepth is large", async () => {
        const result = await executeTool<FlattenOutput>(
          jsonFlatten,
          { input: '{"a": {"b": {"c": 1}}}' },
          { maxDepth: 100 }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(output["a.b.c"]).toBe(1);
        }
      });
    });

    describe("edge cases", () => {
      it("should handle empty object", async () => {
        const result = await executeTool<FlattenOutput>(jsonFlatten, {
          input: "{}",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(output[""]).toEqual({});
        }
      });

      it("should handle empty array", async () => {
        const result = await executeTool<FlattenOutput>(jsonFlatten, {
          input: "[]",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(output[""]).toEqual([]);
        }
      });

      it("should handle null values", async () => {
        const result = await executeTool<FlattenOutput>(jsonFlatten, {
          input: '{"a": null, "b": {"c": null}}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(output["a"]).toBeNull();
          expect(output["b.c"]).toBeNull();
        }
      });

      it("should handle primitive types", async () => {
        const result = await executeTool<FlattenOutput>(jsonFlatten, {
          input: '{"str": "hello", "num": 42, "bool": true, "nil": null}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(output["str"]).toBe("hello");
          expect(output["num"]).toBe(42);
          expect(output["bool"]).toBe(true);
          expect(output["nil"]).toBeNull();
        }
      });

      it("should handle nested empty objects", async () => {
        const result = await executeTool<FlattenOutput>(jsonFlatten, {
          input: '{"a": {"b": {}}}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(output["a.b"]).toEqual({});
        }
      });

      it("should handle nested empty arrays", async () => {
        const result = await executeTool<FlattenOutput>(jsonFlatten, {
          input: '{"a": {"b": []}}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as Record<string, unknown>;
          expect(output["a.b"]).toEqual([]);
        }
      });
    });

    describe("error handling", () => {
      it("should return error for invalid JSON", async () => {
        const result = await executeTool<FlattenOutput>(jsonFlatten, {
          input: "{invalid}",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("JSON_PARSE_ERROR");
        }
      });

      it("should return error for missing input", async () => {
        const result = await executeTool<FlattenOutput>(jsonFlatten, {});

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("INPUT_INVALID_TYPE");
        }
      });
    });
  });
});
