import { describe, it, expect } from "vitest";
import { jsonJmespath } from "../../../src/tools/json/jmespath";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

interface JmespathOutput {
  output: string;
  type: string;
}

describe("jsonJmespath", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(jsonJmespath.meta.id).toBe("json/jmespath");
      expect(jsonJmespath.meta.name).toBe("JSON JMESPath");
      expect(jsonJmespath.meta.category).toBe("json");
      expect(jsonJmespath.meta.tier).toBe(ToolTier.CLIENT);
      expect(jsonJmespath.meta.keywords).toContain("json");
      expect(jsonJmespath.meta.keywords).toContain("jmespath");
      expect(jsonJmespath.meta.keywords).toContain("query");
    });
  });

  describe("execute", () => {
    describe("basic queries", () => {
      it("should query simple property", async () => {
        const result = await executeTool<JmespathOutput>(
          jsonJmespath,
          { input: '{"name": "John", "age": 30}' },
          { expression: "name" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            JSON.parse((result.data as Record<string, unknown>).output)
          ).toBe("John");
          expect((result.data as Record<string, unknown>).type).toBe("string");
        }
      });

      it("should query nested property", async () => {
        const result = await executeTool<JmespathOutput>(
          jsonJmespath,
          {
            input: '{"user": {"name": "John", "address": {"city": "NYC"}}}',
          },
          { expression: "user.address.city" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            JSON.parse((result.data as Record<string, unknown>).output)
          ).toBe("NYC");
        }
      });

      it("should query array element", async () => {
        const result = await executeTool<JmespathOutput>(
          jsonJmespath,
          { input: '{"items": [1, 2, 3]}' },
          { expression: "items[0]" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            JSON.parse((result.data as Record<string, unknown>).output)
          ).toBe(1);
          expect((result.data as Record<string, unknown>).type).toBe("number");
        }
      });

      it("should query entire array", async () => {
        const result = await executeTool<JmespathOutput>(
          jsonJmespath,
          { input: '{"items": [1, 2, 3]}' },
          { expression: "items" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            JSON.parse((result.data as Record<string, unknown>).output)
          ).toEqual([1, 2, 3]);
          expect((result.data as Record<string, unknown>).type).toBe("array");
        }
      });
    });

    describe("advanced queries", () => {
      it("should query with projection", async () => {
        const result = await executeTool<JmespathOutput>(
          jsonJmespath,
          { input: '{"users": [{"name": "John"}, {"name": "Jane"}]}' },
          { expression: "users[*].name" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            JSON.parse((result.data as Record<string, unknown>).output)
          ).toEqual(["John", "Jane"]);
        }
      });

      it("should query with filter", async () => {
        const result = await executeTool<JmespathOutput>(
          jsonJmespath,
          {
            input:
              '{"items": [{"name": "a", "value": 10}, {"name": "b", "value": 20}]}',
          },
          { expression: "items[?value > `15`].name" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            JSON.parse((result.data as Record<string, unknown>).output)
          ).toEqual(["b"]);
        }
      });

      it("should query with slice", async () => {
        const result = await executeTool<JmespathOutput>(
          jsonJmespath,
          { input: '{"items": [0, 1, 2, 3, 4]}' },
          { expression: "items[::2]" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            JSON.parse((result.data as Record<string, unknown>).output)
          ).toEqual([0, 2, 4]);
        }
      });

      it("should query with multiselect", async () => {
        const result = await executeTool<JmespathOutput>(
          jsonJmespath,
          {
            input:
              '{"user": {"firstName": "John", "lastName": "Doe", "age": 30}}',
          },
          { expression: "user.{first: firstName, last: lastName}" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output
          ) as {
            first: string;
            last: string;
          };
          expect(output.first).toBe("John");
          expect(output.last).toBe("Doe");
        }
      });

      it("should query with pipe expression", async () => {
        const result = await executeTool<JmespathOutput>(
          jsonJmespath,
          { input: '{"items": [3, 1, 2]}' },
          { expression: "items | [0]" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            JSON.parse((result.data as Record<string, unknown>).output)
          ).toBe(3);
        }
      });

      it("should query with function", async () => {
        const result = await executeTool<JmespathOutput>(
          jsonJmespath,
          { input: '{"items": [1, 2, 3, 4, 5]}' },
          { expression: "length(items)" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            JSON.parse((result.data as Record<string, unknown>).output)
          ).toBe(5);
        }
      });
    });

    describe("null and undefined handling", () => {
      it("should return null for non-existent path", async () => {
        const result = await executeTool<JmespathOutput>(
          jsonJmespath,
          { input: '{"a": 1}' },
          { expression: "nonexistent" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe("null");
          expect((result.data as Record<string, unknown>).type).toBe("null");
        }
      });

      it("should handle null values in data", async () => {
        const result = await executeTool<JmespathOutput>(
          jsonJmespath,
          { input: '{"value": null}' },
          { expression: "value" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe("null");
          expect((result.data as Record<string, unknown>).type).toBe("null");
        }
      });
    });

    describe("indent option", () => {
      it("should use custom indent", async () => {
        const result = await executeTool(
          jsonJmespath,
          { input: '{"user": {"name": "John"}}' },
          { expression: "user", indent: 4 }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "    "
          );
        }
      });
    });

    describe("default expression", () => {
      it("should return the whole document with default @ expression", async () => {
        const result = await executeTool<JmespathOutput>(jsonJmespath, {
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

    describe("edge cases", () => {
      it("should handle empty object", async () => {
        const result = await executeTool<JmespathOutput>(
          jsonJmespath,
          { input: "{}" },
          { expression: "keys(@)" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            JSON.parse((result.data as Record<string, unknown>).output)
          ).toEqual([]);
        }
      });

      it("should handle empty array", async () => {
        const result = await executeTool<JmespathOutput>(
          jsonJmespath,
          { input: "[]" },
          { expression: "[0]" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe("null");
        }
      });

      it("should handle complex nested structure", async () => {
        const input = {
          store: {
            book: [
              { category: "fiction", price: 10 },
              { category: "tech", price: 20 },
            ],
          },
        };

        const result = await executeTool<JmespathOutput>(
          jsonJmespath,
          { input: JSON.stringify(input) },
          { expression: "store.book[?category == 'tech'].price" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            JSON.parse((result.data as Record<string, unknown>).output)
          ).toEqual([20]);
        }
      });

      it("should handle boolean result", async () => {
        const result = await executeTool<JmespathOutput>(
          jsonJmespath,
          { input: '{"active": true}' },
          { expression: "active" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            JSON.parse((result.data as Record<string, unknown>).output)
          ).toBe(true);
          expect((result.data as Record<string, unknown>).type).toBe("boolean");
        }
      });
    });

    describe("error handling", () => {
      it("should return error for invalid JSON", async () => {
        const result = await executeTool<JmespathOutput>(
          jsonJmespath,
          { input: "{invalid}" },
          { expression: "a" }
        );

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("JSON_PARSE_ERROR");
        }
      });

      it("should return error for invalid JMESPath expression", async () => {
        const result = await executeTool<JmespathOutput>(
          jsonJmespath,
          { input: '{"a": 1}' },
          { expression: "[invalid expression" }
        );

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("JSON_PATH_NOT_FOUND");
        }
      });

      it("should return error for missing input", async () => {
        const result = await executeTool<JmespathOutput>(
          jsonJmespath,
          {},
          { expression: "a" }
        );

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("INPUT_INVALID_TYPE");
        }
      });
    });
  });
});
