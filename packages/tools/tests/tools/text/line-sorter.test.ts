import { describe, it, expect } from "vitest";
import { lineSorter } from "../../../src/tools/text/line-sorter";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("lineSorter", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(lineSorter.meta.id).toBe("text/line-sorter");
      expect(lineSorter.meta.name).toBe("Line Sorter");
      expect(lineSorter.meta.category).toBe("text");
      expect(lineSorter.meta.tier).toBe(ToolTier.CLIENT);
      expect(lineSorter.meta.keywords).toContain("sort");
      expect(lineSorter.meta.keywords).toContain("lines");
    });
  });

  describe("execute", () => {
    it("should sort lines alphabetically ascending by default", async () => {
      const result = await executeTool(lineSorter, {
        input: "charlie\nalpha\nbravo",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "alpha\nbravo\ncharlie"
        );
        expect((result.data as Record<string, unknown>).lineCount).toBe(3);
      }
    });

    it("should sort lines descending when order is desc", async () => {
      const result = await executeTool(
        lineSorter,
        { input: "alpha\nbravo\ncharlie" },
        { order: "desc" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "charlie\nbravo\nalpha"
        );
      }
    });

    it("should sort numerically", async () => {
      const result = await executeTool(
        lineSorter,
        { input: "10\n2\n1\n20" },
        { sortBy: "numeric" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "1\n2\n10\n20"
        );
      }
    });

    it("should sort by length", async () => {
      const result = await executeTool(
        lineSorter,
        { input: "short\nlonger\na\nlongest" },
        { sortBy: "length" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "a\nshort\nlonger\nlongest"
        );
      }
    });

    it("should sort naturally", async () => {
      const result = await executeTool(
        lineSorter,
        { input: "item10\nitem2\nitem1\nitem20" },
        { sortBy: "natural" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "item1\nitem2\nitem10\nitem20"
        );
      }
    });

    it("should be case-insensitive by default", async () => {
      const result = await executeTool(lineSorter, {
        input: "Bravo\nalpha\nCharlie",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "alpha\nBravo\nCharlie"
        );
      }
    });

    it("should be case-sensitive when option is true", async () => {
      const result = await executeTool(
        lineSorter,
        { input: "bravo\nAlpha\ncharlie" },
        { caseSensitive: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Uppercase letters come before lowercase in ASCII
        expect((result.data as Record<string, unknown>).output).toBe(
          "Alpha\nbravo\ncharlie"
        );
      }
    });

    it("should trim lines by default", async () => {
      const result = await executeTool(lineSorter, {
        input: "  charlie  \n  alpha  \n  bravo  ",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "alpha\nbravo\ncharlie"
        );
      }
    });

    it("should preserve whitespace when trimLines is false", async () => {
      const result = await executeTool(
        lineSorter,
        { input: "  b\na\n   c" },
        { trimLines: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Spaces sort before letters
        const lines = (
          (result.data as Record<string, unknown>).output as string
        ).split("\n");
        expect(lines[0]).toBe("   c");
        expect(lines[1]).toBe("  b");
        expect(lines[2]).toBe("a");
      }
    });

    it("should ignore empty lines when option is true", async () => {
      const result = await executeTool(
        lineSorter,
        { input: "charlie\n\nalpha\n\nbravo" },
        { ignoreEmpty: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "alpha\nbravo\ncharlie"
        );
        expect((result.data as Record<string, unknown>).lineCount).toBe(3);
      }
    });

    it("should keep empty lines by default", async () => {
      const result = await executeTool(lineSorter, {
        input: "b\n\na\n\nc",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).lineCount).toBe(5);
        // Empty lines sort first alphabetically
        expect(
          (
            (result.data as Record<string, unknown>).output as string
          ).startsWith("\n")
        ).toBe(true);
      }
    });

    it("should handle empty input", async () => {
      const result = await executeTool(lineSorter, { input: "" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe("");
        expect((result.data as Record<string, unknown>).lineCount).toBe(1);
      }
    });

    it("should handle single line", async () => {
      const result = await executeTool(lineSorter, {
        input: "only one line",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "only one line"
        );
      }
    });

    it("should handle Windows line endings", async () => {
      const result = await executeTool(lineSorter, {
        input: "c\r\na\r\nb",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe("a\nb\nc");
      }
    });

    it("should handle numeric sort with non-numeric lines", async () => {
      const result = await executeTool(
        lineSorter,
        { input: "10\nabc\n5\nxyz\n1" },
        { sortBy: "numeric" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Numbers sort first ascending, non-numeric lines go to the end alphabetically
        const lines = (
          (result.data as Record<string, unknown>).output as string
        ).split("\n");
        expect(lines[0]).toBe("1");
        expect(lines[1]).toBe("5");
        expect(lines[2]).toBe("10");
        expect(lines[3]).toBe("abc");
        expect(lines[4]).toBe("xyz");
      }
    });

    it("should handle length sort descending", async () => {
      const result = await executeTool(
        lineSorter,
        { input: "a\nab\nabc" },
        { sortBy: "length", order: "desc" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "abc\nab\na"
        );
      }
    });

    it("should combine multiple options", async () => {
      const result = await executeTool(
        lineSorter,
        { input: "  CHARLIE  \n\n  alpha  \n\n  BRAVO  " },
        {
          order: "desc",
          sortBy: "alphabetical",
          caseSensitive: false,
          trimLines: true,
          ignoreEmpty: true,
        }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "CHARLIE\nBRAVO\nalpha"
        );
      }
    });
  });
});
