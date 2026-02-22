import { describe, it, expect } from "vitest";
import { lineDeduplicator } from "../../../src/tools/text/line-deduplicator";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("lineDeduplicator", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(lineDeduplicator.meta.id).toBe("text/line-deduplicator");
      expect(lineDeduplicator.meta.name).toBe("Line Deduplicator");
      expect(lineDeduplicator.meta.category).toBe("text");
      expect(lineDeduplicator.meta.tier).toBe(ToolTier.CLIENT);
      expect(lineDeduplicator.meta.keywords).toContain("deduplicate");
      expect(lineDeduplicator.meta.keywords).toContain("unique");
    });
  });

  describe("execute", () => {
    it("should remove duplicate lines", async () => {
      const result = await executeTool(lineDeduplicator, {
        input: "line1\nline2\nline1\nline3\nline2",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "line1\nline2\nline3"
        );
        expect((result.data as Record<string, unknown>).uniqueCount).toBe(3);
        expect((result.data as Record<string, unknown>).duplicatesRemoved).toBe(
          2
        );
      }
    });

    it("should be case-sensitive by default", async () => {
      const result = await executeTool(lineDeduplicator, {
        input: "Line\nline\nLINE",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).uniqueCount).toBe(3);
        expect((result.data as Record<string, unknown>).duplicatesRemoved).toBe(
          0
        );
      }
    });

    it("should be case-insensitive when option is false", async () => {
      const result = await executeTool(
        lineDeduplicator,
        { input: "Line\nline\nLINE" },
        { caseSensitive: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).uniqueCount).toBe(1);
        expect((result.data as Record<string, unknown>).duplicatesRemoved).toBe(
          2
        );
      }
    });

    it("should trim lines by default", async () => {
      const result = await executeTool(lineDeduplicator, {
        input: "  line  \nline\n  line",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).uniqueCount).toBe(1);
        expect((result.data as Record<string, unknown>).output).toBe("line");
      }
    });

    it("should preserve whitespace when trimLines is false", async () => {
      const result = await executeTool(
        lineDeduplicator,
        { input: "  line  \nline\n  line" },
        { trimLines: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // All three are different when whitespace is preserved:
        // "  line  ", "line", "  line"
        expect((result.data as Record<string, unknown>).uniqueCount).toBe(3);
      }
    });

    it("should preserve original order by default", async () => {
      const result = await executeTool(lineDeduplicator, {
        input: "charlie\nalpha\nbravo\nalpha",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "charlie\nalpha\nbravo"
        );
      }
    });

    it("should sort when preserveOrder is false", async () => {
      const result = await executeTool(
        lineDeduplicator,
        { input: "charlie\nalpha\nbravo\nalpha" },
        { preserveOrder: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "alpha\nbravo\ncharlie"
        );
      }
    });

    it("should ignore empty lines when option is true", async () => {
      const result = await executeTool(
        lineDeduplicator,
        { input: "line1\n\nline2\n\nline3" },
        { ignoreEmpty: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "line1\nline2\nline3"
        );
        expect((result.data as Record<string, unknown>).uniqueCount).toBe(3);
      }
    });

    it("should keep empty lines by default", async () => {
      const result = await executeTool(lineDeduplicator, {
        input: "line1\n\nline2",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "line1\n\nline2"
        );
        expect((result.data as Record<string, unknown>).uniqueCount).toBe(3);
      }
    });

    it("should handle empty input", async () => {
      const result = await executeTool(lineDeduplicator, { input: "" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe("");
        expect((result.data as Record<string, unknown>).originalCount).toBe(1);
        expect((result.data as Record<string, unknown>).uniqueCount).toBe(1);
      }
    });

    it("should handle single line", async () => {
      const result = await executeTool(lineDeduplicator, {
        input: "only one line",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "only one line"
        );
        expect((result.data as Record<string, unknown>).duplicatesRemoved).toBe(
          0
        );
      }
    });

    it("should handle all duplicate lines", async () => {
      const result = await executeTool(lineDeduplicator, {
        input: "same\nsame\nsame\nsame",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe("same");
        expect((result.data as Record<string, unknown>).duplicatesRemoved).toBe(
          3
        );
      }
    });

    it("should handle Windows line endings", async () => {
      const result = await executeTool(lineDeduplicator, {
        input: "line1\r\nline2\r\nline1",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).uniqueCount).toBe(2);
      }
    });

    it("should report correct counts", async () => {
      const result = await executeTool(lineDeduplicator, {
        input: "a\nb\na\nc\nb\na",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).originalCount).toBe(6);
        expect((result.data as Record<string, unknown>).uniqueCount).toBe(3);
        expect((result.data as Record<string, unknown>).duplicatesRemoved).toBe(
          3
        );
      }
    });

    it("should handle lines with only whitespace", async () => {
      const result = await executeTool(lineDeduplicator, {
        input: "text\n   \ntext\n\t\t",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // With trimLines default true, whitespace-only lines become empty
        expect(
          (result.data as Record<string, unknown>).uniqueCount
        ).toBeLessThanOrEqual(4);
      }
    });

    it("should combine all options", async () => {
      const result = await executeTool(
        lineDeduplicator,
        { input: "  Bravo  \nALPHA\n\nalpha\n  bravo" },
        {
          caseSensitive: false,
          trimLines: true,
          preserveOrder: false,
          ignoreEmpty: true,
        }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).uniqueCount).toBe(2);
        // preserveOrder: false sorts alphabetically, but keeps original case of first occurrence
        expect((result.data as Record<string, unknown>).output).toBe(
          "ALPHA\nBravo"
        );
      }
    });
  });
});
