import { describe, it, expect } from "vitest";
import { textDiff } from "../../../src/tools/text/text-diff";
import { executeTool } from "../../../src/core/executor";

describe("textDiff", () => {
  describe("meta", () => {
    it("should have correct tool metadata", () => {
      expect(textDiff.meta.id).toBe("text/diff");
      expect(textDiff.meta.name).toBe("Text Diff");
      expect(textDiff.meta.category).toBe("text");
    });
  });

  describe("execute", () => {
    describe("identical texts", () => {
      it("should detect identical texts", async () => {
        const result = await executeTool(textDiff, {
          input1: "Hello World",
          input2: "Hello World",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          const stats = data.stats as Record<string, unknown>;
          expect(data.identical).toBe(true);
          expect(stats.additions).toBe(0);
          expect(stats.deletions).toBe(0);
        }
      });

      it("should return unchanged changes for identical texts", async () => {
        const result = await executeTool(textDiff, {
          input1: "Hello",
          input2: "Hello",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          const changes = data.changes as Record<string, unknown>[];
          expect(changes.length).toBeGreaterThan(0);
          expect(
            changes.every(
              (c: Record<string, unknown>) => c.type === "unchanged"
            )
          ).toBe(true);
        }
      });
    });

    describe("different texts", () => {
      it("should detect additions", async () => {
        const result = await executeTool(textDiff, {
          input1: "Hello",
          input2: "Hello World",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          const stats = data.stats as Record<string, unknown>;
          expect(data.identical).toBe(false);
          expect(stats.additions as number).toBeGreaterThan(0);
        }
      });

      it("should detect deletions", async () => {
        const result = await executeTool(textDiff, {
          input1: "Hello World",
          input2: "Hello",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          const stats = data.stats as Record<string, unknown>;
          expect(data.identical).toBe(false);
          expect(stats.deletions as number).toBeGreaterThan(0);
        }
      });

      it("should detect modifications", async () => {
        const result = await executeTool(textDiff, {
          input1: "Hello World",
          input2: "Hello Earth",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          const stats = data.stats as Record<string, unknown>;
          expect(data.identical).toBe(false);
          expect(stats.additions as number).toBeGreaterThan(0);
          expect(stats.deletions as number).toBeGreaterThan(0);
        }
      });
    });

    describe("change types", () => {
      it("should mark added content correctly", async () => {
        const result = await executeTool(textDiff, {
          input1: "one two",
          input2: "one two three",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const changes = (result.data as Record<string, unknown>)
            .changes as Record<string, unknown>[];
          const added = changes.find(
            (c: Record<string, unknown>) => c.type === "added"
          );
          expect(added).toBeDefined();
          expect(added?.value as string).toContain("three");
        }
      });

      it("should mark removed content correctly", async () => {
        const result = await executeTool(textDiff, {
          input1: "one two three",
          input2: "one two",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const changes = (result.data as Record<string, unknown>)
            .changes as Record<string, unknown>[];
          const removed = changes.find(
            (c: Record<string, unknown>) => c.type === "removed"
          );
          expect(removed).toBeDefined();
          expect(removed?.value as string).toContain("three");
        }
      });

      it("should mark unchanged content correctly", async () => {
        const result = await executeTool(textDiff, {
          input1: "one two three",
          input2: "one two four",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const changes = (result.data as Record<string, unknown>)
            .changes as Record<string, unknown>[];
          const unchanged = changes.find(
            (c: Record<string, unknown>) => c.type === "unchanged"
          );
          expect(unchanged).toBeDefined();
        }
      });
    });

    describe("statistics", () => {
      it("should count additions correctly", async () => {
        const result = await executeTool(textDiff, {
          input1: "original",
          input2: "original plus extra words",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const stats = (result.data as Record<string, unknown>)
            .stats as Record<string, unknown>;
          expect(stats.additions as number).toBeGreaterThan(0);
        }
      });

      it("should count deletions correctly", async () => {
        const result = await executeTool(textDiff, {
          input1: "original plus extra words",
          input2: "original",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const stats = (result.data as Record<string, unknown>)
            .stats as Record<string, unknown>;
          expect(stats.deletions as number).toBeGreaterThan(0);
        }
      });

      it("should count unchanged correctly", async () => {
        const result = await executeTool(textDiff, {
          input1: "one two three",
          input2: "one two four",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const stats = (result.data as Record<string, unknown>)
            .stats as Record<string, unknown>;
          expect(stats.unchanged as number).toBeGreaterThan(0);
        }
      });
    });

    describe("options", () => {
      it("should ignore whitespace when option enabled", async () => {
        const result = await executeTool(
          textDiff,
          {
            input1: "hello   world",
            input2: "hello world",
          },
          { ignoreWhitespace: true }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).identical).toBe(true);
        }
      });

      it("should be case-sensitive by default", async () => {
        const result = await executeTool(textDiff, {
          input1: "Hello",
          input2: "hello",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).identical).toBe(
            false
          );
        }
      });

      it("should ignore case when option enabled", async () => {
        const result = await executeTool(
          textDiff,
          {
            input1: "Hello World",
            input2: "hello world",
          },
          { ignoreCase: true }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).identical).toBe(true);
        }
      });
    });

    describe("edge cases", () => {
      it("should handle empty inputs", async () => {
        const result = await executeTool(textDiff, {
          input1: "",
          input2: "",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).identical).toBe(true);
        }
      });

      it("should handle first empty input", async () => {
        const result = await executeTool(textDiff, {
          input1: "",
          input2: "Hello",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          const stats = data.stats as Record<string, unknown>;
          expect(data.identical).toBe(false);
          expect(stats.additions as number).toBeGreaterThan(0);
        }
      });

      it("should handle second empty input", async () => {
        const result = await executeTool(textDiff, {
          input1: "Hello",
          input2: "",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          const stats = data.stats as Record<string, unknown>;
          expect(data.identical).toBe(false);
          expect(stats.deletions as number).toBeGreaterThan(0);
        }
      });

      it("should handle special characters", async () => {
        const result = await executeTool(textDiff, {
          input1: "Hello! @#$%",
          input2: "Hello! @#$% World",
        });
        expect(result.success).toBe(true);
      });

      it("should handle newlines", async () => {
        const result = await executeTool(textDiff, {
          input1: "line1\nline2",
          input2: "line1\nline2\nline3",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).identical).toBe(
            false
          );
        }
      });

      it("should handle long texts", async () => {
        const long1 = "word ".repeat(1000);
        const long2 = "word ".repeat(1000) + "extra";
        const result = await executeTool(textDiff, {
          input1: long1,
          input2: long2,
        });
        expect(result.success).toBe(true);
      });

      it("should include word count in changes", async () => {
        const result = await executeTool(textDiff, {
          input1: "one two",
          input2: "one two three four",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const changes = (result.data as Record<string, unknown>)
            .changes as Record<string, unknown>[];
          const added = changes.find(
            (c: Record<string, unknown>) => c.type === "added"
          );
          expect(added?.count).toBeDefined();
        }
      });
    });
  });
});
