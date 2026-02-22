import { describe, it, expect } from "vitest";
import { jsonUnflatten } from "../../../src/tools/json/unflatten";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

interface UnflattenOutput {
  output: string;
}

function nested(obj: Record<string, unknown>, ...keys: string[]): unknown {
  let current: unknown = obj;
  for (const key of keys) {
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

describe("jsonUnflatten", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(jsonUnflatten.meta.id).toBe("json/unflatten");
      expect(jsonUnflatten.meta.name).toBe("JSON Unflatten");
      expect(jsonUnflatten.meta.category).toBe("json");
      expect(jsonUnflatten.meta.tier).toBe(ToolTier.CLIENT);
      expect(jsonUnflatten.meta.keywords).toContain("json");
      expect(jsonUnflatten.meta.keywords).toContain("unflatten");
    });
  });

  describe("execute", () => {
    describe("basic unflattening", () => {
      it("should unflatten dot-notation keys", async () => {
        const result = await executeTool<UnflattenOutput>(jsonUnflatten, {
          input: '{"a.b.c": 1}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output as string
          ) as Record<string, unknown>;
          expect(nested(output, "a", "b", "c")).toBe(1);
        }
      });

      it("should unflatten multiple keys", async () => {
        const result = await executeTool<UnflattenOutput>(jsonUnflatten, {
          input: '{"user.name": "John", "user.age": 30}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output as string
          ) as Record<string, unknown>;
          expect(nested(output, "user", "name")).toBe("John");
          expect(nested(output, "user", "age")).toBe(30);
        }
      });

      it("should unflatten deeply nested keys", async () => {
        const result = await executeTool<UnflattenOutput>(jsonUnflatten, {
          input: '{"a.b.c.d.e": "deep"}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output as string
          ) as Record<string, unknown>;
          expect(nested(output, "a", "b", "c", "d", "e")).toBe("deep");
        }
      });

      it("should handle mixed depth keys", async () => {
        const result = await executeTool<UnflattenOutput>(jsonUnflatten, {
          input: '{"a": 1, "b.c": 2, "d.e.f": 3}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output as string
          ) as Record<string, unknown>;
          expect(output.a).toBe(1);
          expect(nested(output, "b", "c")).toBe(2);
          expect(nested(output, "d", "e", "f")).toBe(3);
        }
      });
    });

    describe("array unflattening", () => {
      it("should unflatten array indices", async () => {
        const result = await executeTool<UnflattenOutput>(jsonUnflatten, {
          input: '{"items[0]": 1, "items[1]": 2, "items[2]": 3}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output as string
          ) as Record<string, unknown>;
          expect(output.items).toEqual([1, 2, 3]);
        }
      });

      it("should unflatten nested objects in arrays", async () => {
        const result = await executeTool<UnflattenOutput>(jsonUnflatten, {
          input: '{"users[0].name": "John", "users[1].name": "Jane"}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output as string
          ) as Record<string, unknown>;
          const users = output.users as Record<string, unknown>[];
          expect(users[0].name).toBe("John");
          expect(users[1].name).toBe("Jane");
        }
      });

      it("should handle sparse arrays", async () => {
        const result = await executeTool<UnflattenOutput>(jsonUnflatten, {
          input: '{"items[0]": 1, "items[2]": 3}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output as string
          ) as Record<string, unknown>;
          const items = output.items as unknown[];
          expect(items[0]).toBe(1);
          expect(items[2]).toBe(3);
        }
      });

      it("should handle nested arrays", async () => {
        const result = await executeTool<UnflattenOutput>(jsonUnflatten, {
          input: '{"matrix[0][0]": 1, "matrix[0][1]": 2, "matrix[1][0]": 3}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output as string
          ) as Record<string, unknown>;
          const matrix = output.matrix as unknown[][];
          expect(matrix[0][0]).toBe(1);
          expect(matrix[0][1]).toBe(2);
          expect(matrix[1][0]).toBe(3);
        }
      });
    });

    describe("custom delimiter", () => {
      it("should use custom delimiter", async () => {
        const result = await executeTool<UnflattenOutput>(
          jsonUnflatten,
          { input: '{"a_b_c": 1}' },
          { delimiter: "_" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output as string
          ) as Record<string, unknown>;
          expect(nested(output, "a", "b", "c")).toBe(1);
        }
      });

      it("should use multi-character delimiter", async () => {
        const result = await executeTool<UnflattenOutput>(
          jsonUnflatten,
          { input: '{"a->b->c": 1}' },
          { delimiter: "->" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output as string
          ) as Record<string, unknown>;
          expect(nested(output, "a", "b", "c")).toBe(1);
        }
      });
    });

    describe("indent option", () => {
      it("should use custom indent", async () => {
        const result = await executeTool<UnflattenOutput>(
          jsonUnflatten,
          { input: '{"a.b": 1}' },
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

    describe("roundtrip with flatten", () => {
      it("should roundtrip simple nested object", async () => {
        // Flattened representation
        const flattened = '{"a.b.c": 1}';

        const result = await executeTool<UnflattenOutput>(jsonUnflatten, {
          input: flattened,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output as string
          ) as Record<string, unknown>;
          expect(output).toEqual({ a: { b: { c: 1 } } });
        }
      });

      it("should roundtrip with arrays", async () => {
        const flattened = '{"items[0]": 1, "items[1]": 2}';

        const result = await executeTool<UnflattenOutput>(jsonUnflatten, {
          input: flattened,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output as string
          ) as Record<string, unknown>;
          expect(output.items).toEqual([1, 2]);
        }
      });
    });

    describe("edge cases", () => {
      it("should handle flat object (no nesting)", async () => {
        const result = await executeTool<UnflattenOutput>(jsonUnflatten, {
          input: '{"a": 1, "b": 2}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output as string
          ) as Record<string, unknown>;
          expect(output).toEqual({ a: 1, b: 2 });
        }
      });

      it("should handle empty object", async () => {
        const result = await executeTool<UnflattenOutput>(jsonUnflatten, {
          input: "{}",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output as string
          ) as Record<string, unknown>;
          expect(output).toEqual({});
        }
      });

      it("should handle null values", async () => {
        const result = await executeTool<UnflattenOutput>(jsonUnflatten, {
          input: '{"a.b": null}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output as string
          ) as Record<string, unknown>;
          expect(nested(output, "a", "b")).toBeNull();
        }
      });

      it("should handle boolean values", async () => {
        const result = await executeTool<UnflattenOutput>(jsonUnflatten, {
          input: '{"a.b": true, "a.c": false}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output as string
          ) as Record<string, unknown>;
          expect(nested(output, "a", "b")).toBe(true);
          expect(nested(output, "a", "c")).toBe(false);
        }
      });

      it("should handle string values with special characters", async () => {
        const result = await executeTool<UnflattenOutput>(jsonUnflatten, {
          input: '{"a.b": "hello.world"}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output as string
          ) as Record<string, unknown>;
          expect(nested(output, "a", "b")).toBe("hello.world");
        }
      });

      it("should handle numeric values", async () => {
        const result = await executeTool<UnflattenOutput>(jsonUnflatten, {
          input: '{"a.b": 42, "a.c": 3.14}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output as string
          ) as Record<string, unknown>;
          expect(nested(output, "a", "b")).toBe(42);
          expect(nested(output, "a", "c")).toBe(3.14);
        }
      });

      it("should handle keys with numbers", async () => {
        const result = await executeTool<UnflattenOutput>(jsonUnflatten, {
          input: '{"user1.name": "John", "user2.name": "Jane"}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const output = JSON.parse(
            (result.data as Record<string, unknown>).output as string
          ) as Record<string, unknown>;
          expect(nested(output, "user1", "name")).toBe("John");
          expect(nested(output, "user2", "name")).toBe("Jane");
        }
      });
    });

    describe("error handling", () => {
      it("should return error for invalid JSON", async () => {
        const result = await executeTool<UnflattenOutput>(jsonUnflatten, {
          input: "{invalid}",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("JSON_PARSE_ERROR");
        }
      });

      it("should return error for non-object input", async () => {
        const result = await executeTool<UnflattenOutput>(jsonUnflatten, {
          input: "[1, 2, 3]",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("JSON_PARSE_ERROR");
        }
      });

      it("should return error for missing input", async () => {
        const result = await executeTool<UnflattenOutput>(jsonUnflatten, {});

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("INPUT_INVALID_TYPE");
        }
      });

      it("should return error for null input", async () => {
        const result = await executeTool<UnflattenOutput>(jsonUnflatten, {
          input: "null",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("JSON_PARSE_ERROR");
        }
      });

      it("should return error for primitive input", async () => {
        const result = await executeTool<UnflattenOutput>(jsonUnflatten, {
          input: '"string"',
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("JSON_PARSE_ERROR");
        }
      });
    });
  });
});
