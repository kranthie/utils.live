import { describe, it, expect } from "vitest";
import { emptyLineRemover } from "../../../src/tools/text/empty-line-remover";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("emptyLineRemover", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(emptyLineRemover.meta.id).toBe("text/empty-line-remover");
      expect(emptyLineRemover.meta.name).toBe("Empty Line Remover");
      expect(emptyLineRemover.meta.category).toBe("text");
      expect(emptyLineRemover.meta.tier).toBe(ToolTier.CLIENT);
      expect(emptyLineRemover.meta.keywords).toContain("empty");
      expect(emptyLineRemover.meta.keywords).toContain("blank");
    });
  });

  describe("execute", () => {
    it("should remove empty lines", async () => {
      const result = await executeTool(emptyLineRemover, {
        input: "line1\n\nline2\n\nline3",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "line1\nline2\nline3"
        );
        expect((result.data as Record<string, unknown>).removedCount).toBe(2);
      }
    });

    it("should remove whitespace-only lines by default", async () => {
      const result = await executeTool(emptyLineRemover, {
        input: "line1\n   \nline2\n\t\nline3",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "line1\nline2\nline3"
        );
        expect((result.data as Record<string, unknown>).removedCount).toBe(2);
      }
    });

    it("should keep whitespace-only lines when option is false", async () => {
      const result = await executeTool(
        emptyLineRemover,
        { input: "line1\n   \nline2\n\nline3" },
        { whitespaceOnly: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "line1\n   \nline2\nline3"
        );
        expect((result.data as Record<string, unknown>).removedCount).toBe(1);
      }
    });

    it("should keep up to maxConsecutive empty lines", async () => {
      const result = await executeTool(
        emptyLineRemover,
        { input: "line1\n\n\n\nline2" },
        { maxConsecutive: 1 }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "line1\n\nline2"
        );
        expect((result.data as Record<string, unknown>).removedCount).toBe(2);
      }
    });

    it("should keep 2 consecutive empty lines when maxConsecutive is 2", async () => {
      const result = await executeTool(
        emptyLineRemover,
        { input: "line1\n\n\n\n\nline2" },
        { maxConsecutive: 2 }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "line1\n\n\nline2"
        );
        expect((result.data as Record<string, unknown>).removedCount).toBe(2);
      }
    });

    it("should handle empty input", async () => {
      const result = await executeTool(emptyLineRemover, { input: "" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe("");
        expect((result.data as Record<string, unknown>).originalCount).toBe(1);
        expect((result.data as Record<string, unknown>).resultCount).toBe(0);
      }
    });

    it("should handle input with no empty lines", async () => {
      const result = await executeTool(emptyLineRemover, {
        input: "line1\nline2\nline3",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "line1\nline2\nline3"
        );
        expect((result.data as Record<string, unknown>).removedCount).toBe(0);
      }
    });

    it("should handle input with only empty lines", async () => {
      const result = await executeTool(emptyLineRemover, {
        input: "\n\n\n",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe("");
        expect((result.data as Record<string, unknown>).removedCount).toBe(4);
      }
    });

    it("should handle Windows line endings", async () => {
      const result = await executeTool(emptyLineRemover, {
        input: "line1\r\n\r\nline2",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "line1\nline2"
        );
        expect((result.data as Record<string, unknown>).removedCount).toBe(1);
      }
    });

    it("should report correct counts", async () => {
      const result = await executeTool(emptyLineRemover, {
        input: "a\n\nb\n\n\nc",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).originalCount).toBe(6);
        expect((result.data as Record<string, unknown>).resultCount).toBe(3);
        expect((result.data as Record<string, unknown>).removedCount).toBe(3);
      }
    });

    it("should handle leading empty lines", async () => {
      const result = await executeTool(emptyLineRemover, {
        input: "\n\nline1\nline2",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "line1\nline2"
        );
        expect((result.data as Record<string, unknown>).removedCount).toBe(2);
      }
    });

    it("should handle trailing empty lines", async () => {
      const result = await executeTool(emptyLineRemover, {
        input: "line1\nline2\n\n",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "line1\nline2"
        );
        expect((result.data as Record<string, unknown>).removedCount).toBe(2);
      }
    });

    it("should handle maxConsecutive with trailing empties", async () => {
      const result = await executeTool(
        emptyLineRemover,
        { input: "line1\n\n\n" },
        { maxConsecutive: 1 }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe("line1\n");
        expect((result.data as Record<string, unknown>).removedCount).toBe(2);
      }
    });

    it("should handle single line input", async () => {
      const result = await executeTool(emptyLineRemover, {
        input: "single line",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "single line"
        );
        expect((result.data as Record<string, unknown>).removedCount).toBe(0);
      }
    });
  });
});
