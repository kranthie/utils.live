import { describe, it, expect } from "vitest";
import { jsonPathQuery } from "../../../src/tools/json/path-query";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

interface PathQueryOutput {
  output: string;
  found: boolean;
  type: string;
}

describe("jsonPathQuery", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(jsonPathQuery.meta.id).toBe("json/path-query");
      expect(jsonPathQuery.meta.name).toBe("JSON Path Query");
      expect(jsonPathQuery.meta.category).toBe("json");
      expect(jsonPathQuery.meta.tier).toBe(ToolTier.CLIENT);
      expect(jsonPathQuery.meta.keywords).toContain("json");
      expect(jsonPathQuery.meta.keywords).toContain("path");
      expect(jsonPathQuery.meta.keywords).toContain("query");
    });
  });

  describe("execute", () => {
    describe("dot notation", () => {
      it("should query simple property", async () => {
        const result = await executeTool<PathQueryOutput>(
          jsonPathQuery,
          { input: '{"name": "John", "age": 30}' },
          { query: "name" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            JSON.parse((result.data as Record<string, unknown>).output)
          ).toBe("John");
          expect((result.data as Record<string, unknown>).found).toBe(true);
          expect((result.data as Record<string, unknown>).type).toBe("string");
        }
      });

      it("should query nested property", async () => {
        const result = await executeTool<PathQueryOutput>(
          jsonPathQuery,
          { input: '{"user": {"name": "John", "address": {"city": "NYC"}}}' },
          { query: "user.address.city" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            JSON.parse((result.data as Record<string, unknown>).output)
          ).toBe("NYC");
        }
      });

      it("should query deeply nested property", async () => {
        const result = await executeTool<PathQueryOutput>(
          jsonPathQuery,
          { input: '{"a": {"b": {"c": {"d": {"e": 5}}}}}' },
          { query: "a.b.c.d.e" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            JSON.parse((result.data as Record<string, unknown>).output)
          ).toBe(5);
        }
      });
    });

    describe("bracket notation", () => {
      it("should query array element by index", async () => {
        const result = await executeTool<PathQueryOutput>(
          jsonPathQuery,
          { input: '{"items": [1, 2, 3]}' },
          { query: "items[0]" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            JSON.parse((result.data as Record<string, unknown>).output)
          ).toBe(1);
          expect((result.data as Record<string, unknown>).type).toBe("number");
        }
      });

      it("should query last array element", async () => {
        const result = await executeTool<PathQueryOutput>(
          jsonPathQuery,
          { input: '{"items": [1, 2, 3]}' },
          { query: "items[2]" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            JSON.parse((result.data as Record<string, unknown>).output)
          ).toBe(3);
        }
      });

      it("should query nested array element", async () => {
        const result = await executeTool<PathQueryOutput>(
          jsonPathQuery,
          { input: '{"users": [{"name": "John"}, {"name": "Jane"}]}' },
          { query: "users[1].name" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            JSON.parse((result.data as Record<string, unknown>).output)
          ).toBe("Jane");
        }
      });

      it("should query with string key in brackets", async () => {
        const result = await executeTool<PathQueryOutput>(
          jsonPathQuery,
          { input: '{"user": {"full name": "John Doe"}}' },
          { query: "user['full name']" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            JSON.parse((result.data as Record<string, unknown>).output)
          ).toBe("John Doe");
        }
      });

      it("should query with double-quoted string key in brackets", async () => {
        const result = await executeTool<PathQueryOutput>(
          jsonPathQuery,
          { input: '{"user": {"full name": "John Doe"}}' },
          { query: 'user["full name"]' }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            JSON.parse((result.data as Record<string, unknown>).output)
          ).toBe("John Doe");
        }
      });
    });

    describe("root path variations", () => {
      it("should handle $ prefix", async () => {
        const result = await executeTool<PathQueryOutput>(
          jsonPathQuery,
          { input: '{"name": "John"}' },
          { query: "$.name" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            JSON.parse((result.data as Record<string, unknown>).output)
          ).toBe("John");
        }
      });

      it("should return root with $ only", async () => {
        const result = await executeTool<PathQueryOutput>(
          jsonPathQuery,
          { input: '{"name": "John"}' },
          { query: "$" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            JSON.parse((result.data as Record<string, unknown>).output)
          ).toEqual({ name: "John" });
        }
      });

      it("should return root with default query", async () => {
        const result = await executeTool<PathQueryOutput>(jsonPathQuery, {
          input: '{"name": "John"}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            JSON.parse((result.data as Record<string, unknown>).output)
          ).toEqual({ name: "John" });
        }
      });
    });

    describe("type detection", () => {
      it("should detect object type", async () => {
        const result = await executeTool<PathQueryOutput>(
          jsonPathQuery,
          { input: '{"user": {"name": "John"}}' },
          { query: "user" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).type).toBe("object");
        }
      });

      it("should detect array type", async () => {
        const result = await executeTool<PathQueryOutput>(
          jsonPathQuery,
          { input: '{"items": [1, 2, 3]}' },
          { query: "items" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).type).toBe("array");
        }
      });

      it("should detect string type", async () => {
        const result = await executeTool<PathQueryOutput>(
          jsonPathQuery,
          { input: '{"name": "John"}' },
          { query: "name" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).type).toBe("string");
        }
      });

      it("should detect number type", async () => {
        const result = await executeTool<PathQueryOutput>(
          jsonPathQuery,
          { input: '{"age": 30}' },
          { query: "age" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).type).toBe("number");
        }
      });

      it("should detect boolean type", async () => {
        const result = await executeTool<PathQueryOutput>(
          jsonPathQuery,
          { input: '{"active": true}' },
          { query: "active" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).type).toBe("boolean");
        }
      });

      it("should detect null type", async () => {
        const result = await executeTool<PathQueryOutput>(
          jsonPathQuery,
          { input: '{"value": null}' },
          { query: "value" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).type).toBe("null");
        }
      });
    });

    describe("edge cases", () => {
      it("should handle empty object", async () => {
        const result = await executeTool<PathQueryOutput>(
          jsonPathQuery,
          { input: "{}" },
          { query: "$" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            JSON.parse((result.data as Record<string, unknown>).output)
          ).toEqual({});
        }
      });

      it("should handle empty array", async () => {
        const result = await executeTool<PathQueryOutput>(
          jsonPathQuery,
          { input: "[]" },
          { query: "$" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            JSON.parse((result.data as Record<string, unknown>).output)
          ).toEqual([]);
        }
      });

      it("should handle complex nested structure", async () => {
        const input = {
          store: {
            book: [
              { title: "Book 1", price: 10 },
              { title: "Book 2", price: 20 },
            ],
          },
        };

        const result = await executeTool<PathQueryOutput>(
          jsonPathQuery,
          { input: JSON.stringify(input) },
          { query: "store.book[0].title" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            JSON.parse((result.data as Record<string, unknown>).output)
          ).toBe("Book 1");
        }
      });
    });

    describe("error handling", () => {
      it("should return error for invalid JSON", async () => {
        const result = await executeTool<PathQueryOutput>(
          jsonPathQuery,
          { input: "{invalid}" },
          { query: "a" }
        );

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("JSON_PARSE_ERROR");
        }
      });

      it("should return error for empty query", async () => {
        const result = await executeTool<PathQueryOutput>(
          jsonPathQuery,
          { input: '{"a": 1}' },
          { query: "   " }
        );

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("JSON_INVALID_PATH");
        }
      });

      it("should return error for non-existent path", async () => {
        const result = await executeTool<PathQueryOutput>(
          jsonPathQuery,
          { input: '{"a": 1}' },
          { query: "nonexistent" }
        );

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("JSON_PATH_NOT_FOUND");
        }
      });

      it("should return error for array index on non-array", async () => {
        const result = await executeTool<PathQueryOutput>(
          jsonPathQuery,
          { input: '{"a": 1}' },
          { query: "a[0]" }
        );

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("JSON_PATH_NOT_FOUND");
        }
      });

      it("should return error for out-of-bounds array index", async () => {
        const result = await executeTool<PathQueryOutput>(
          jsonPathQuery,
          { input: '{"items": [1, 2, 3]}' },
          { query: "items[10]" }
        );

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("JSON_PATH_NOT_FOUND");
        }
      });

      it("should return error for missing input", async () => {
        const result = await executeTool<PathQueryOutput>(
          jsonPathQuery,
          {},
          { query: "a" }
        );

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("INPUT_INVALID_TYPE");
        }
      });
    });
  });
});
