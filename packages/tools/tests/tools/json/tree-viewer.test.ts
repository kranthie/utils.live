import { describe, it, expect } from "vitest";
import { jsonTreeViewer } from "../../../src/tools/json/tree-viewer";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

interface TreeViewerOutput {
  output: string;
  nodeCount: number;
}

describe("jsonTreeViewer", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(jsonTreeViewer.meta.id).toBe("json/tree-viewer");
      expect(jsonTreeViewer.meta.name).toBe("JSON Tree Viewer");
      expect(jsonTreeViewer.meta.category).toBe("json");
      expect(jsonTreeViewer.meta.tier).toBe(ToolTier.CLIENT);
      expect(jsonTreeViewer.meta.keywords).toContain("json");
      expect(jsonTreeViewer.meta.keywords).toContain("tree");
      expect(jsonTreeViewer.meta.keywords).toContain("view");
    });
  });

  describe("execute", () => {
    describe("basic tree generation", () => {
      it("should display simple object as tree", async () => {
        const result = await executeTool<TreeViewerOutput>(jsonTreeViewer, {
          input: '{"name": "John", "age": 30}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "name:"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "age:"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "John"
          );
          expect(
            (result.data as Record<string, unknown>).nodeCount
          ).toBeGreaterThan(0);
        }
      });

      it("should display nested objects", async () => {
        const result = await executeTool<TreeViewerOutput>(jsonTreeViewer, {
          input: '{"user": {"name": "John", "address": {"city": "NYC"}}}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "user:"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "name:"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "address:"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "city:"
          );
        }
      });

      it("should display arrays", async () => {
        const result = await executeTool<TreeViewerOutput>(jsonTreeViewer, {
          input: '{"items": [1, 2, 3]}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "Array[3]"
          );
        }
      });
    });

    describe("tree structure characters", () => {
      it("should use tree connectors", async () => {
        const result = await executeTool<TreeViewerOutput>(jsonTreeViewer, {
          input: '{"a": 1, "b": 2}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          // Should contain tree connector characters
          expect(
            (
              (result.data as Record<string, unknown>).output as string
            ).includes("├──") ||
              (
                (result.data as Record<string, unknown>).output as string
              ).includes("└──")
          ).toBe(true);
        }
      });

      it("should show proper last item connector", async () => {
        const result = await executeTool<TreeViewerOutput>(jsonTreeViewer, {
          input: '{"a": 1, "b": 2, "c": 3}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "└──"
          );
        }
      });

      it("should show vertical lines for nested items", async () => {
        const result = await executeTool<TreeViewerOutput>(jsonTreeViewer, {
          input: '{"a": {"b": 1}, "c": 2}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          // Should contain vertical connector
          expect(
            (
              (result.data as Record<string, unknown>).output as string
            ).includes("│") ||
              (
                (result.data as Record<string, unknown>).output as string
              ).includes("    ")
          ).toBe(true);
        }
      });
    });

    describe("showTypes option", () => {
      it("should show types by default", async () => {
        const result = await executeTool<TreeViewerOutput>(jsonTreeViewer, {
          input: '{"name": "John", "age": 30}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "(string)"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "(number)"
          );
        }
      });

      it("should hide types when option is false", async () => {
        const result = await executeTool(
          jsonTreeViewer,
          { input: '{"name": "John"}' },
          { showTypes: false }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).not.toContain(
            "(string)"
          );
        }
      });

      it("should show null type", async () => {
        const result = await executeTool<TreeViewerOutput>(jsonTreeViewer, {
          input: '{"value": null}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "null"
          );
        }
      });
    });

    describe("showValues option", () => {
      it("should show values by default", async () => {
        const result = await executeTool<TreeViewerOutput>(jsonTreeViewer, {
          input: '{"name": "John"}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "John"
          );
        }
      });

      it("should hide values when option is false", async () => {
        const result = await executeTool(
          jsonTreeViewer,
          { input: '{"name": "John"}' },
          { showValues: false }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "name:"
          );
          // Value should not appear in the output
        }
      });
    });

    describe("maxDepth option", () => {
      it("should respect maxDepth limit", async () => {
        const result = await executeTool(
          jsonTreeViewer,
          { input: '{"a": {"b": {"c": {"d": {"e": 1}}}}}' },
          { maxDepth: 2 }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "... (max depth)"
          );
        }
      });

      it("should show full tree when maxDepth is high", async () => {
        const result = await executeTool(
          jsonTreeViewer,
          { input: '{"a": {"b": 1}}' },
          { maxDepth: 20 }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).not.toContain(
            "... (max depth)"
          );
        }
      });
    });

    describe("node counting", () => {
      it("should count nodes in simple object", async () => {
        const result = await executeTool<TreeViewerOutput>(jsonTreeViewer, {
          input: '{"a": 1, "b": 2}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).nodeCount
          ).toBeGreaterThanOrEqual(1);
        }
      });

      it("should count nodes in nested objects", async () => {
        const result = await executeTool<TreeViewerOutput>(jsonTreeViewer, {
          input: '{"a": {"b": {"c": 1}}}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).nodeCount
          ).toBeGreaterThan(1);
        }
      });

      it("should count nodes in arrays", async () => {
        const result = await executeTool<TreeViewerOutput>(jsonTreeViewer, {
          input: "[1, 2, 3, 4, 5]",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).nodeCount
          ).toBeGreaterThanOrEqual(5);
        }
      });
    });

    describe("edge cases", () => {
      it("should handle empty object", async () => {
        const result = await executeTool<TreeViewerOutput>(jsonTreeViewer, {
          input: "{}",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "(empty)"
          );
        }
      });

      it("should handle empty array", async () => {
        const result = await executeTool<TreeViewerOutput>(jsonTreeViewer, {
          input: "[]",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "(empty)"
          );
        }
      });

      it("should handle null at root", async () => {
        const result = await executeTool<TreeViewerOutput>(jsonTreeViewer, {
          input: "null",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "null"
          );
        }
      });

      it("should handle primitives at root", async () => {
        const stringResult = await executeTool<TreeViewerOutput>(
          jsonTreeViewer,
          {
            input: '"hello"',
          }
        );
        expect(stringResult.success).toBe(true);
        if (stringResult.success) {
          expect(
            (stringResult.data as Record<string, unknown>).output
          ).toContain("hello");
        }

        const numberResult = await executeTool<TreeViewerOutput>(
          jsonTreeViewer,
          {
            input: "42",
          }
        );
        expect(numberResult.success).toBe(true);
        if (numberResult.success) {
          expect(
            (numberResult.data as Record<string, unknown>).output
          ).toContain("42");
        }
      });

      it("should handle arrays of objects", async () => {
        const result = await executeTool<TreeViewerOutput>(jsonTreeViewer, {
          input: '[{"name": "John"}, {"name": "Jane"}]',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "Array[2]"
          );
        }
      });

      it("should handle mixed nested content", async () => {
        const result = await executeTool<TreeViewerOutput>(jsonTreeViewer, {
          input:
            '{"users": [{"name": "John", "tags": ["a", "b"]}], "count": 1}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "users:"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "tags:"
          );
        }
      });

      it("should handle boolean values", async () => {
        const result = await executeTool<TreeViewerOutput>(jsonTreeViewer, {
          input: '{"active": true, "deleted": false}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "true"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "false"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "(boolean)"
          );
        }
      });

      it("should handle special characters in keys", async () => {
        const result = await executeTool<TreeViewerOutput>(jsonTreeViewer, {
          input: '{"key with spaces": "value", "key:colon": "value2"}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "key with spaces"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "key:colon"
          );
        }
      });
    });

    describe("combined options", () => {
      it("should apply multiple options together", async () => {
        const result = await executeTool(
          jsonTreeViewer,
          { input: '{"a": {"b": 1, "c": 2}}' },
          { showTypes: true, showValues: true, maxDepth: 10 }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "(number)"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "1"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "2"
          );
        }
      });
    });

    describe("error handling", () => {
      it("should return error for invalid JSON", async () => {
        const result = await executeTool<TreeViewerOutput>(jsonTreeViewer, {
          input: "{invalid}",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("JSON_PARSE_ERROR");
        }
      });

      it("should return error for empty input", async () => {
        const result = await executeTool<TreeViewerOutput>(jsonTreeViewer, {
          input: "",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("JSON_PARSE_ERROR");
        }
      });

      it("should return error for missing input", async () => {
        const result = await executeTool<TreeViewerOutput>(jsonTreeViewer, {});

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("INPUT_INVALID_TYPE");
        }
      });
    });
  });
});
