import { describe, it, expect } from "vitest";
import { jsonDiff } from "../../../src/tools/json/diff";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

interface DiffOutput {
  identical: boolean;
  differences: Array<{
    path: string;
    type: "added" | "removed" | "changed" | "type_changed";
    oldValue?: unknown;
    newValue?: unknown;
  }>;
  summary: {
    added: number;
    removed: number;
    changed: number;
    total: number;
  };
}

describe("jsonDiff", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(jsonDiff.meta.id).toBe("json/diff");
      expect(jsonDiff.meta.name).toBe("JSON Diff");
      expect(jsonDiff.meta.category).toBe("json");
      expect(jsonDiff.meta.tier).toBe(ToolTier.CLIENT);
      expect(jsonDiff.meta.keywords).toContain("json");
      expect(jsonDiff.meta.keywords).toContain("diff");
      expect(jsonDiff.meta.keywords).toContain("compare");
    });
  });

  describe("execute", () => {
    describe("identical JSON", () => {
      it("should detect identical objects", async () => {
        const result = await executeTool<DiffOutput>(jsonDiff, {
          input1: '{"name": "test", "value": 123}',
          input2: '{"name": "test", "value": 123}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).identical).toBe(true);
          expect(
            (result.data as Record<string, unknown>).differences
          ).toHaveLength(0);
          expect(
            (
              (result.data as Record<string, unknown>).summary as Record<
                string,
                unknown
              >
            ).total
          ).toBe(0);
        }
      });

      it("should detect identical arrays", async () => {
        const result = await executeTool<DiffOutput>(jsonDiff, {
          input1: "[1, 2, 3]",
          input2: "[1, 2, 3]",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).identical).toBe(true);
          expect(
            (result.data as Record<string, unknown>).differences
          ).toHaveLength(0);
        }
      });

      it("should detect identical nested objects", async () => {
        const result = await executeTool<DiffOutput>(jsonDiff, {
          input1: '{"a": {"b": {"c": 1}}}',
          input2: '{"a": {"b": {"c": 1}}}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).identical).toBe(true);
        }
      });

      it("should detect identical primitives", async () => {
        const result = await executeTool<DiffOutput>(jsonDiff, {
          input1: '"hello"',
          input2: '"hello"',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).identical).toBe(true);
        }
      });
    });

    describe("added keys", () => {
      it("should detect added keys", async () => {
        const result = await executeTool<DiffOutput>(jsonDiff, {
          input1: '{"name": "test"}',
          input2: '{"name": "test", "age": 25}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).identical).toBe(
            false
          );
          expect(
            (result.data as Record<string, unknown>).differences
          ).toHaveLength(1);
          expect(
            (
              (result.data as Record<string, unknown>).differences as Record<
                string,
                unknown
              >[]
            )[0].type
          ).toBe("added");
          expect(
            (
              (result.data as Record<string, unknown>).differences as Record<
                string,
                unknown
              >[]
            )[0].path
          ).toBe("$.age");
          expect(
            (
              (result.data as Record<string, unknown>).differences as Record<
                string,
                unknown
              >[]
            )[0].newValue
          ).toBe(25);
          expect(
            (
              (result.data as Record<string, unknown>).summary as Record<
                string,
                unknown
              >
            ).added
          ).toBe(1);
        }
      });

      it("should detect added array elements", async () => {
        const result = await executeTool<DiffOutput>(jsonDiff, {
          input1: "[1, 2]",
          input2: "[1, 2, 3]",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).differences
          ).toHaveLength(1);
          expect(
            (
              (result.data as Record<string, unknown>).differences as Record<
                string,
                unknown
              >[]
            )[0].type
          ).toBe("added");
          expect(
            (
              (result.data as Record<string, unknown>).differences as Record<
                string,
                unknown
              >[]
            )[0].path
          ).toBe("$[2]");
          expect(
            (
              (result.data as Record<string, unknown>).differences as Record<
                string,
                unknown
              >[]
            )[0].newValue
          ).toBe(3);
        }
      });
    });

    describe("removed keys", () => {
      it("should detect removed keys", async () => {
        const result = await executeTool<DiffOutput>(jsonDiff, {
          input1: '{"name": "test", "age": 25}',
          input2: '{"name": "test"}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).identical).toBe(
            false
          );
          expect(
            (result.data as Record<string, unknown>).differences
          ).toHaveLength(1);
          expect(
            (
              (result.data as Record<string, unknown>).differences as Record<
                string,
                unknown
              >[]
            )[0].type
          ).toBe("removed");
          expect(
            (
              (result.data as Record<string, unknown>).differences as Record<
                string,
                unknown
              >[]
            )[0].path
          ).toBe("$.age");
          expect(
            (
              (result.data as Record<string, unknown>).differences as Record<
                string,
                unknown
              >[]
            )[0].oldValue
          ).toBe(25);
          expect(
            (
              (result.data as Record<string, unknown>).summary as Record<
                string,
                unknown
              >
            ).removed
          ).toBe(1);
        }
      });

      it("should detect removed array elements", async () => {
        const result = await executeTool<DiffOutput>(jsonDiff, {
          input1: "[1, 2, 3]",
          input2: "[1, 2]",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).differences
          ).toHaveLength(1);
          expect(
            (
              (result.data as Record<string, unknown>).differences as Record<
                string,
                unknown
              >[]
            )[0].type
          ).toBe("removed");
          expect(
            (
              (result.data as Record<string, unknown>).differences as Record<
                string,
                unknown
              >[]
            )[0].path
          ).toBe("$[2]");
        }
      });
    });

    describe("changed values", () => {
      it("should detect changed values", async () => {
        const result = await executeTool<DiffOutput>(jsonDiff, {
          input1: '{"name": "test"}',
          input2: '{"name": "changed"}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).identical).toBe(
            false
          );
          expect(
            (result.data as Record<string, unknown>).differences
          ).toHaveLength(1);
          expect(
            (
              (result.data as Record<string, unknown>).differences as Record<
                string,
                unknown
              >[]
            )[0].type
          ).toBe("changed");
          expect(
            (
              (result.data as Record<string, unknown>).differences as Record<
                string,
                unknown
              >[]
            )[0].oldValue
          ).toBe("test");
          expect(
            (
              (result.data as Record<string, unknown>).differences as Record<
                string,
                unknown
              >[]
            )[0].newValue
          ).toBe("changed");
          expect(
            (
              (result.data as Record<string, unknown>).summary as Record<
                string,
                unknown
              >
            ).changed
          ).toBe(1);
        }
      });

      it("should detect changed array values", async () => {
        const result = await executeTool<DiffOutput>(jsonDiff, {
          input1: "[1, 2, 3]",
          input2: "[1, 5, 3]",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).differences
          ).toHaveLength(1);
          expect(
            (
              (result.data as Record<string, unknown>).differences as Record<
                string,
                unknown
              >[]
            )[0].type
          ).toBe("changed");
          expect(
            (
              (result.data as Record<string, unknown>).differences as Record<
                string,
                unknown
              >[]
            )[0].path
          ).toBe("$[1]");
        }
      });
    });

    describe("type changes", () => {
      it("should detect type changes", async () => {
        const result = await executeTool<DiffOutput>(jsonDiff, {
          input1: '{"value": "123"}',
          input2: '{"value": 123}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).identical).toBe(
            false
          );
          expect(
            (result.data as Record<string, unknown>).differences
          ).toHaveLength(1);
          expect(
            (
              (result.data as Record<string, unknown>).differences as Record<
                string,
                unknown
              >[]
            )[0].type
          ).toBe("type_changed");
          expect(
            (
              (result.data as Record<string, unknown>).summary as Record<
                string,
                unknown
              >
            ).changed
          ).toBe(1);
        }
      });

      it("should detect object to array type change", async () => {
        const result = await executeTool<DiffOutput>(jsonDiff, {
          input1: '{"value": {"a": 1}}',
          input2: '{"value": [1]}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).differences
          ).toHaveLength(1);
          expect(
            (
              (result.data as Record<string, unknown>).differences as Record<
                string,
                unknown
              >[]
            )[0].type
          ).toBe("type_changed");
        }
      });

      it("should detect null to value type change", async () => {
        const result = await executeTool<DiffOutput>(jsonDiff, {
          input1: '{"value": null}',
          input2: '{"value": "hello"}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).differences
          ).toHaveLength(1);
          expect(
            (
              (result.data as Record<string, unknown>).differences as Record<
                string,
                unknown
              >[]
            )[0].type
          ).toBe("type_changed");
        }
      });
    });

    describe("complex scenarios", () => {
      it("should handle deeply nested changes", async () => {
        const result = await executeTool<DiffOutput>(jsonDiff, {
          input1: '{"a": {"b": {"c": {"d": 1}}}}',
          input2: '{"a": {"b": {"c": {"d": 2}}}}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).differences
          ).toHaveLength(1);
          expect(
            (
              (result.data as Record<string, unknown>).differences as Record<
                string,
                unknown
              >[]
            )[0].path
          ).toBe("$.a.b.c.d");
        }
      });

      it("should handle multiple differences", async () => {
        const result = await executeTool<DiffOutput>(jsonDiff, {
          input1: '{"a": 1, "b": 2, "c": 3}',
          input2: '{"a": 1, "b": 5, "d": 4}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).identical).toBe(
            false
          );
          expect(
            (
              (result.data as Record<string, unknown>).summary as Record<
                string,
                unknown
              >
            ).total
          ).toBe(3); // b changed, c removed, d added
        }
      });

      it("should handle arrays within objects", async () => {
        const result = await executeTool<DiffOutput>(jsonDiff, {
          input1: '{"items": [1, 2, 3]}',
          input2: '{"items": [1, 2, 4]}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).differences
          ).toHaveLength(1);
          expect(
            (
              (result.data as Record<string, unknown>).differences as Record<
                string,
                unknown
              >[]
            )[0].path
          ).toBe("$.items[2]");
        }
      });

      it("should handle empty objects", async () => {
        const result = await executeTool<DiffOutput>(jsonDiff, {
          input1: "{}",
          input2: "{}",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).identical).toBe(true);
        }
      });

      it("should handle empty arrays", async () => {
        const result = await executeTool<DiffOutput>(jsonDiff, {
          input1: "[]",
          input2: "[]",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).identical).toBe(true);
        }
      });
    });

    describe("error handling", () => {
      it("should return error for invalid first JSON", async () => {
        const result = await executeTool<DiffOutput>(jsonDiff, {
          input1: "{invalid}",
          input2: "{}",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("JSON_PARSE_ERROR");
          expect(result.error.message).toContain("first input");
        }
      });

      it("should return error for invalid second JSON", async () => {
        const result = await executeTool<DiffOutput>(jsonDiff, {
          input1: "{}",
          input2: "{invalid}",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("JSON_PARSE_ERROR");
          expect(result.error.message).toContain("second input");
        }
      });

      it("should return error for missing input1", async () => {
        const result = await executeTool<DiffOutput>(jsonDiff, {
          input2: "{}",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("INPUT_INVALID_TYPE");
        }
      });

      it("should return error for missing input2", async () => {
        const result = await executeTool<DiffOutput>(jsonDiff, {
          input1: "{}",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("INPUT_INVALID_TYPE");
        }
      });
    });
  });
});
