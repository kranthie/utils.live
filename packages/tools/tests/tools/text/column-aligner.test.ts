import { describe, it, expect } from "vitest";
import { columnAligner } from "../../../src/tools/text/column-aligner";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("columnAligner", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(columnAligner.meta.id).toBe("text/column-aligner");
      expect(columnAligner.meta.name).toBe("Column Aligner");
      expect(columnAligner.meta.category).toBe("text");
      expect(columnAligner.meta.tier).toBe(ToolTier.CLIENT);
      expect(columnAligner.meta.keywords).toContain("column");
      expect(columnAligner.meta.keywords).toContain("align");
    });
  });

  describe("execute", () => {
    it("should align columns with default pipe delimiter", async () => {
      const result = await executeTool(columnAligner, {
        input: "a|bb|ccc\ndddd|e|ff",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).columnCount).toBe(3);
        const lines = (
          (result.data as Record<string, unknown>).output as string
        ).split("\n");
        expect(lines.length).toBe(2);
      }
    });

    it("should align with left alignment (default)", async () => {
      const result = await executeTool(
        columnAligner,
        { input: "a|bb\ncc|d" },
        { alignment: "left" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const lines = (
          (result.data as Record<string, unknown>).output as string
        ).split("\n");
        // Left-aligned, first cell should start with the content
        expect(lines[0]).toContain("a ");
        expect(lines[1]).toContain("cc");
      }
    });

    it("should align with right alignment", async () => {
      const result = await executeTool(
        columnAligner,
        { input: "a|bb\ncc|d" },
        { alignment: "right" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const lines = (
          (result.data as Record<string, unknown>).output as string
        ).split("\n");
        // Right-aligned, first cell should have padding before 'a'
        expect(lines[0]).toContain(" a");
      }
    });

    it("should align with center alignment", async () => {
      const result = await executeTool(
        columnAligner,
        { input: "a|bbbb\nccc|d" },
        { alignment: "center" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).columnCount).toBe(2);
      }
    });

    it("should use custom delimiter", async () => {
      const result = await executeTool(
        columnAligner,
        { input: "a,bb,ccc\ndddd,e,ff" },
        { delimiter: "," }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).columnCount).toBe(3);
      }
    });

    it("should use custom output delimiter", async () => {
      const result = await executeTool(
        columnAligner,
        { input: "a|bb" },
        { delimiter: "|", outputDelimiter: ":" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(":");
      }
    });

    it("should handle custom padding", async () => {
      const result = await executeTool(
        columnAligner,
        { input: "a|bb\ncc|d" },
        { padding: 3 }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // With padding 3, there should be more spaces around the delimiter
        expect((result.data as Record<string, unknown>).output).toContain(
          "   |   "
        );
      }
    });

    it("should handle empty input", async () => {
      const result = await executeTool(columnAligner, { input: "" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).columnCount).toBe(1);
      }
    });

    it("should handle single column", async () => {
      const result = await executeTool(columnAligner, {
        input: "hello\nworld",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).columnCount).toBe(1);
      }
    });

    it("should handle uneven column counts", async () => {
      const result = await executeTool(columnAligner, {
        input: "a|b|c\nd|e",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).columnCount).toBe(3);
        // Second row should be padded to match first row
      }
    });

    it("should trim whitespace from cells", async () => {
      const result = await executeTool(columnAligner, {
        input: "  a  |  bb  |  ccc  ",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).columnCount).toBe(3);
      }
    });

    it("should handle Windows line endings", async () => {
      const result = await executeTool(columnAligner, {
        input: "a|bb\r\ncc|d",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).columnCount).toBe(2);
        const lines = (
          (result.data as Record<string, unknown>).output as string
        ).split("\n");
        expect(lines.length).toBe(2);
      }
    });

    it("should handle tab delimiter", async () => {
      const result = await executeTool(
        columnAligner,
        { input: "a\tbb\tccc\ndddd\te\tff" },
        { delimiter: "\t" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).columnCount).toBe(3);
      }
    });

    it("should handle many columns", async () => {
      const result = await executeTool(columnAligner, {
        input: "a|b|c|d|e|f|g|h|i|j",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).columnCount).toBe(10);
      }
    });

    it("should handle cells with only spaces", async () => {
      const result = await executeTool(columnAligner, {
        input: "a|   |c",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).columnCount).toBe(3);
      }
    });
  });
});
