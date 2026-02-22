import { describe, it, expect } from "vitest";
import { lineNumberer } from "../../../src/tools/text/line-numberer";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("lineNumberer", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(lineNumberer.meta.id).toBe("text/line-numberer");
      expect(lineNumberer.meta.name).toBe("Line Numberer");
      expect(lineNumberer.meta.category).toBe("text");
      expect(lineNumberer.meta.tier).toBe(ToolTier.CLIENT);
      expect(lineNumberer.meta.keywords).toContain("line");
      expect(lineNumberer.meta.keywords).toContain("number");
    });
  });

  describe("execute", () => {
    it("should add line numbers with default options", async () => {
      const result = await executeTool(lineNumberer, {
        input: "first\nsecond\nthird",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "1: first\n2: second\n3: third"
        );
        expect((result.data as Record<string, unknown>).lineCount).toBe(3);
      }
    });

    it("should respect startFrom option", async () => {
      const result = await executeTool(
        lineNumberer,
        { input: "first\nsecond\nthird" },
        { startFrom: 10 }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "10: first\n11: second\n12: third"
        );
      }
    });

    it("should respect custom separator", async () => {
      const result = await executeTool(
        lineNumberer,
        { input: "first\nsecond" },
        { separator: ". " }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "1. first\n2. second"
        );
      }
    });

    it("should respect padWidth option", async () => {
      const result = await executeTool(
        lineNumberer,
        { input: "first\nsecond" },
        { padWidth: 3 }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "  1: first\n  2: second"
        );
      }
    });

    it("should respect padChar option", async () => {
      const result = await executeTool(
        lineNumberer,
        { input: "first\nsecond" },
        { padWidth: 3, padChar: "0" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "001: first\n002: second"
        );
      }
    });

    it("should skip empty lines when option is true", async () => {
      const result = await executeTool(
        lineNumberer,
        { input: "first\n\nthird" },
        { skipEmpty: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "1: first\n\n2: third"
        );
      }
    });

    it("should number empty lines by default", async () => {
      const result = await executeTool(lineNumberer, {
        input: "first\n\nthird",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "1: first\n2: \n3: third"
        );
      }
    });

    it("should handle empty input", async () => {
      const result = await executeTool(lineNumberer, { input: "" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe("1: ");
        expect((result.data as Record<string, unknown>).lineCount).toBe(1);
      }
    });

    it("should handle single line", async () => {
      const result = await executeTool(lineNumberer, {
        input: "single line",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "1: single line"
        );
        expect((result.data as Record<string, unknown>).lineCount).toBe(1);
      }
    });

    it("should handle Windows line endings", async () => {
      const result = await executeTool(lineNumberer, {
        input: "first\r\nsecond",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).lineCount).toBe(2);
        expect((result.data as Record<string, unknown>).output).toBe(
          "1: first\n2: second"
        );
      }
    });

    it("should auto-calculate pad width based on line count", async () => {
      // With 100 lines, should auto-pad to 3 digits
      const lines = Array.from({ length: 100 }, (_, i) => `line${i + 1}`).join(
        "\n"
      );
      const result = await executeTool(lineNumberer, { input: lines });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).lineCount).toBe(100);
        // First line should be padded: "  1: line1"
        const firstLine = (
          (result.data as Record<string, unknown>).output as string
        ).split("\n")[0];
        expect(firstLine).toBe("  1: line1");
        // Last line should be: "100: line100"
        const lastLine = (
          (result.data as Record<string, unknown>).output as string
        ).split("\n")[99];
        expect(lastLine).toBe("100: line100");
      }
    });

    it("should use startFrom for line number calculation", async () => {
      const result = await executeTool(
        lineNumberer,
        { input: "a\nb\nc" },
        { startFrom: 100 }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Should pad to 3 digits since max is 102
        expect((result.data as Record<string, unknown>).output).toBe(
          "100: a\n101: b\n102: c"
        );
      }
    });

    it("should handle negative startFrom", async () => {
      const result = await executeTool(
        lineNumberer,
        { input: "a\nb\nc" },
        { startFrom: -1 }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // The padding is based on max line number (1), not accounting for negative sign
        expect((result.data as Record<string, unknown>).output).toBe(
          "-1: a\n0: b\n1: c"
        );
      }
    });

    it("should combine multiple options", async () => {
      const result = await executeTool(
        lineNumberer,
        { input: "first\n\nthird" },
        {
          startFrom: 5,
          separator: " | ",
          padWidth: 2,
          padChar: "0",
          skipEmpty: true,
        }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "05 | first\n\n06 | third"
        );
      }
    });

    it("should handle whitespace-only lines with skipEmpty", async () => {
      const result = await executeTool(
        lineNumberer,
        { input: "first\n   \nthird" },
        { skipEmpty: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // skipEmpty checks line.trim().length === 0, so whitespace-only lines are skipped
        expect((result.data as Record<string, unknown>).output).toBe(
          "1: first\n   \n2: third"
        );
      }
    });
  });
});
