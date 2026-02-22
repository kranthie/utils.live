import { describe, it, expect } from "vitest";
import { markdownTableGenerator } from "../../../src/tools/markdown/table-generator";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("markdownTableGenerator", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(markdownTableGenerator.meta.id).toBe("markdown/table-generator");
      expect(markdownTableGenerator.meta.name).toBe("Markdown Table Generator");
      expect(markdownTableGenerator.meta.category).toBe("markdown");
      expect(markdownTableGenerator.meta.tier).toBe(ToolTier.CLIENT);
      expect(markdownTableGenerator.meta.keywords).toContain("table");
      expect(markdownTableGenerator.meta.keywords).toContain("generate");
    });
  });

  describe("execute", () => {
    it("should generate basic table", async () => {
      const result = await executeTool(markdownTableGenerator, {
        headers: ["Col1", "Col2"],
        rows: [
          ["A", "B"],
          ["C", "D"],
        ],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "| Col1 | Col2 |"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "| A | B |"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "| C | D |"
        );
        expect((result.data as Record<string, unknown>).rowCount).toBe(2);
        expect((result.data as Record<string, unknown>).columnCount).toBe(2);
      }
    });

    it("should generate table with separator row", async () => {
      const result = await executeTool(markdownTableGenerator, {
        headers: ["Name", "Age"],
        rows: [["John", "25"]],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toMatch(
          /\|[\s:-]+\|/
        );
      }
    });

    it("should apply left alignment by default", async () => {
      const result = await executeTool(markdownTableGenerator, {
        headers: ["Col"],
        rows: [["Data"]],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          ":---"
        );
      }
    });

    it("should apply center alignment", async () => {
      const result = await executeTool(
        markdownTableGenerator,
        {
          headers: ["Col1", "Col2"],
          rows: [["A", "B"]],
        },
        { alignment: ["center", "center"] }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          ":---:"
        );
      }
    });

    it("should apply right alignment", async () => {
      const result = await executeTool(
        markdownTableGenerator,
        {
          headers: ["Col1", "Col2"],
          rows: [["A", "B"]],
        },
        { alignment: ["right", "right"] }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "---:"
        );
      }
    });

    it("should apply mixed alignment", async () => {
      const result = await executeTool(
        markdownTableGenerator,
        {
          headers: ["Left", "Center", "Right"],
          rows: [["A", "B", "C"]],
        },
        { alignment: ["left", "center", "right"] }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          ":---"
        );
        expect((result.data as Record<string, unknown>).output).toMatch(
          /:---:/
        );
        expect((result.data as Record<string, unknown>).output).toMatch(/---:/);
      }
    });

    it("should escape pipe characters in content", async () => {
      const result = await executeTool(markdownTableGenerator, {
        headers: ["Command"],
        rows: [["a | b"]],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "a \\| b"
        );
      }
    });

    it("should handle empty rows array", async () => {
      const result = await executeTool(markdownTableGenerator, {
        headers: ["Col1", "Col2"],
        rows: [],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).rowCount).toBe(0);
        expect((result.data as Record<string, unknown>).output).toContain(
          "| Col1 | Col2 |"
        );
      }
    });

    it("should handle rows with fewer columns than headers", async () => {
      const result = await executeTool(markdownTableGenerator, {
        headers: ["A", "B", "C"],
        rows: [["1"]],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Should pad with empty cells
        expect((result.data as Record<string, unknown>).columnCount).toBe(3);
      }
    });

    it("should fail with empty headers array", async () => {
      const result = await executeTool(markdownTableGenerator, {
        headers: [],
        rows: [["A"]],
      });

      expect(result.success).toBe(false);
    });

    it("should handle single column table", async () => {
      const result = await executeTool(markdownTableGenerator, {
        headers: ["Only"],
        rows: [["Row1"], ["Row2"]],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).columnCount).toBe(1);
        expect((result.data as Record<string, unknown>).rowCount).toBe(2);
      }
    });

    it("should handle many columns", async () => {
      const result = await executeTool(markdownTableGenerator, {
        headers: ["A", "B", "C", "D", "E", "F", "G"],
        rows: [["1", "2", "3", "4", "5", "6", "7"]],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).columnCount).toBe(7);
      }
    });

    it("should handle special characters in content", async () => {
      const result = await executeTool(markdownTableGenerator, {
        headers: ["Special"],
        rows: [["**bold** `code` *italic*"]],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "**bold**"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "`code`"
        );
      }
    });

    it("should handle empty string in cells", async () => {
      const result = await executeTool(markdownTableGenerator, {
        headers: ["A", "B"],
        rows: [
          ["", "Data"],
          ["Data", ""],
        ],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).rowCount).toBe(2);
      }
    });

    it("should return correct row and column counts", async () => {
      const result = await executeTool(markdownTableGenerator, {
        headers: ["H1", "H2", "H3"],
        rows: [
          ["R1C1", "R1C2", "R1C3"],
          ["R2C1", "R2C2", "R2C3"],
          ["R3C1", "R3C2", "R3C3"],
        ],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).rowCount).toBe(3);
        expect((result.data as Record<string, unknown>).columnCount).toBe(3);
      }
    });

    it("should generate valid markdown table syntax", async () => {
      const result = await executeTool(markdownTableGenerator, {
        headers: ["Name", "Value"],
        rows: [
          ["Item", "100"],
          ["Other", "200"],
        ],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        const lines = data.output.split("\n");
        // Should have 4 lines: header, separator, 2 data rows
        expect(lines).toHaveLength(4);
        // Each line should start and end with |
        lines.forEach((line: string) => {
          expect(line.startsWith("|")).toBe(true);
          expect(line.endsWith("|")).toBe(true);
        });
      }
    });

    it("should use default alignment for missing alignment entries", async () => {
      const result = await executeTool(
        markdownTableGenerator,
        {
          headers: ["A", "B", "C"],
          rows: [["1", "2", "3"]],
        },
        { alignment: ["center"] }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // First column should be center, others should be left (default)
        expect((result.data as Record<string, unknown>).output).toMatch(
          /:---:/
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          ":---"
        );
      }
    });
  });
});
