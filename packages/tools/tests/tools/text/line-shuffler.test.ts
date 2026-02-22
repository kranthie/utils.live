import { describe, it, expect } from "vitest";
import { lineShuffler } from "../../../src/tools/text/line-shuffler";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("lineShuffler", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(lineShuffler.meta.id).toBe("text/line-shuffler");
      expect(lineShuffler.meta.name).toBe("Line Shuffler");
      expect(lineShuffler.meta.category).toBe("text");
      expect(lineShuffler.meta.tier).toBe(ToolTier.CLIENT);
      expect(lineShuffler.meta.keywords).toContain("shuffle");
      expect(lineShuffler.meta.keywords).toContain("random");
    });
  });

  describe("execute", () => {
    it("should shuffle lines", async () => {
      const result = await executeTool(lineShuffler, {
        input: "a\nb\nc\nd\ne\nf\ng\nh\ni\nj",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).lineCount).toBe(10);
        const lines = (
          (result.data as Record<string, unknown>).output as string
        ).split("\n");
        expect(lines.length).toBe(10);
        // All original lines should be present
        expect(lines.sort().join("\n")).toBe("a\nb\nc\nd\ne\nf\ng\nh\ni\nj");
      }
    });

    it("should return different order on multiple calls (randomness)", async () => {
      const input = "a\nb\nc\nd\ne\nf\ng\nh\ni\nj";
      const results: string[] = [];

      for (let i = 0; i < 10; i++) {
        const result = await executeTool(lineShuffler, { input });
        if (result.success) {
          results.push((result.data as Record<string, unknown>).output);
        }
      }

      // With 10 shuffles, it's extremely unlikely all are the same
      const uniqueResults = new Set(results);
      expect(uniqueResults.size).toBeGreaterThan(1);
    });

    it("should remove empty lines when ignoreEmpty is true", async () => {
      const result = await executeTool(
        lineShuffler,
        { input: "a\n\nb\n\nc" },
        { ignoreEmpty: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).lineCount).toBe(3);
        const lines = (
          (result.data as Record<string, unknown>).output as string
        ).split("\n");
        expect(lines.every((line: string) => line.trim().length > 0)).toBe(
          true
        );
      }
    });

    it("should keep empty lines by default", async () => {
      const result = await executeTool(lineShuffler, {
        input: "a\n\nb\n\nc",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).lineCount).toBe(5);
      }
    });

    it("should handle empty input", async () => {
      const result = await executeTool(lineShuffler, { input: "" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe("");
        expect((result.data as Record<string, unknown>).lineCount).toBe(1);
      }
    });

    it("should handle single line", async () => {
      const result = await executeTool(lineShuffler, {
        input: "only one line",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "only one line"
        );
        expect((result.data as Record<string, unknown>).lineCount).toBe(1);
      }
    });

    it("should handle Windows line endings", async () => {
      const result = await executeTool(lineShuffler, {
        input: "a\r\nb\r\nc",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).lineCount).toBe(3);
      }
    });

    it("should preserve line content", async () => {
      const input = "Line with spaces\nLine with\ttabs\nLine with special @#$%";
      const result = await executeTool(lineShuffler, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const originalLines = input.split("\n").sort();
        const shuffledLines = (
          (result.data as Record<string, unknown>).output as string
        )
          .split("\n")
          .sort();
        expect(shuffledLines).toEqual(originalLines);
      }
    });

    it("should handle duplicate lines", async () => {
      const result = await executeTool(lineShuffler, {
        input: "same\nsame\nsame",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).lineCount).toBe(3);
        expect((result.data as Record<string, unknown>).output).toBe(
          "same\nsame\nsame"
        );
      }
    });

    it("should handle whitespace-only lines", async () => {
      const result = await executeTool(lineShuffler, {
        input: "text\n   \nmore text",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).lineCount).toBe(3);
      }
    });

    it("should ignore whitespace-only lines when ignoreEmpty is true", async () => {
      const result = await executeTool(
        lineShuffler,
        { input: "text\n   \nmore text" },
        { ignoreEmpty: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).lineCount).toBe(2);
      }
    });

    it("should handle large number of lines", async () => {
      const lines = Array.from({ length: 100 }, (_, i) => `line${i + 1}`);
      const result = await executeTool(lineShuffler, {
        input: lines.join("\n"),
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).lineCount).toBe(100);
        const shuffledLines = (
          (result.data as Record<string, unknown>).output as string
        )
          .split("\n")
          .sort();
        expect(shuffledLines).toEqual(lines.sort());
      }
    });
  });
});
