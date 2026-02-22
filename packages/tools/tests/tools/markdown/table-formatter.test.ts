import { describe, it, expect } from "vitest";
import { markdownTableFormatter } from "../../../src/tools/markdown/table-formatter";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("markdownTableFormatter", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(markdownTableFormatter.meta.id).toBe("markdown/table-formatter");
      expect(markdownTableFormatter.meta.name).toBe("Markdown Table Formatter");
      expect(markdownTableFormatter.meta.category).toBe("markdown");
      expect(markdownTableFormatter.meta.tier).toBe(ToolTier.CLIENT);
      expect(markdownTableFormatter.meta.keywords).toContain("table");
      expect(markdownTableFormatter.meta.keywords).toContain("format");
    });
  });

  describe("execute", () => {
    it("should format basic table", async () => {
      const result = await executeTool(markdownTableFormatter, {
        input: "|Col1|Col2|\n|---|---|\n|A|B|",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).tablesFormatted).toBe(
          1
        );
        expect((result.data as Record<string, unknown>).output).toContain("|");
      }
    });

    it("should align columns properly", async () => {
      const result = await executeTool(markdownTableFormatter, {
        input: "|Name|Age|\n|---|---|\n|John|25|\n|Elizabeth|30|",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).tablesFormatted).toBe(
          1
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Name"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Elizabeth"
        );
      }
    });

    it("should preserve left alignment", async () => {
      const result = await executeTool(markdownTableFormatter, {
        input: "|Col1|Col2|\n|:---|:---|\n|A|B|",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          ":---"
        );
      }
    });

    it("should preserve center alignment", async () => {
      const result = await executeTool(markdownTableFormatter, {
        input: "|Col1|Col2|\n|:---:|:---:|\n|A|B|",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toMatch(
          /:[-]+:/
        );
      }
    });

    it("should preserve right alignment", async () => {
      const result = await executeTool(markdownTableFormatter, {
        input: "|Col1|Col2|\n|---:|---:|\n|A|B|",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toMatch(
          /[-]+:/
        );
      }
    });

    it("should apply custom alignment", async () => {
      const result = await executeTool(
        markdownTableFormatter,
        { input: "|Col1|Col2|Col3|\n|---|---|---|\n|A|B|C|" },
        { alignment: ["left", "center", "right"] }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          ":---"
        );
        expect((result.data as Record<string, unknown>).output).toMatch(
          /:[-]+:/
        );
        expect((result.data as Record<string, unknown>).output).toMatch(
          /[-]+:/
        );
      }
    });

    it("should apply custom padding", async () => {
      const result = await executeTool(
        markdownTableFormatter,
        { input: "|Col1|Col2|\n|---|---|\n|A|B|" },
        { padding: 2 }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // With padding=2, content should have more spacing
        expect((result.data as Record<string, unknown>).output).toMatch(
          /\| {2}.+ {2}\|/
        );
      }
    });

    it("should handle table with no padding option", async () => {
      const result = await executeTool(
        markdownTableFormatter,
        { input: "|Col1|Col2|\n|---|---|\n|A|B|" },
        { padding: 0 }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).tablesFormatted).toBe(
          1
        );
      }
    });

    it("should handle multiple tables", async () => {
      const result = await executeTool(markdownTableFormatter, {
        input:
          "|A|B|\n|---|---|\n|1|2|\n\nSome text\n\n|C|D|\n|---|---|\n|3|4|",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).tablesFormatted).toBe(
          2
        );
      }
    });

    it("should handle document with no tables", async () => {
      const result = await executeTool(markdownTableFormatter, {
        input: "# Just text\n\nNo tables here.",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).tablesFormatted).toBe(
          0
        );
        expect((result.data as Record<string, unknown>).output).toBe(
          "# Just text\n\nNo tables here."
        );
      }
    });

    it("should handle empty input", async () => {
      const result = await executeTool(markdownTableFormatter, {
        input: "",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).tablesFormatted).toBe(
          0
        );
        expect((result.data as Record<string, unknown>).output).toBe("");
      }
    });

    it("should handle varying column widths", async () => {
      const result = await executeTool(markdownTableFormatter, {
        input: "|Short|Very Long Header|\n|---|---|\n|A|B|",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Headers should be padded to match content
        expect((result.data as Record<string, unknown>).output).toContain(
          "Very Long Header"
        );
      }
    });

    it("should handle table with empty cells", async () => {
      const result = await executeTool(markdownTableFormatter, {
        input: "|A|B|C|\n|---|---|---|\n||B||",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).tablesFormatted).toBe(
          1
        );
      }
    });

    it("should handle table with different row lengths", async () => {
      const result = await executeTool(markdownTableFormatter, {
        input: "|A|B|C|\n|---|---|---|\n|1|2|",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).tablesFormatted).toBe(
          1
        );
      }
    });

    it("should preserve content around tables", async () => {
      const result = await executeTool(markdownTableFormatter, {
        input: "Before\n\n|A|B|\n|---|---|\n|1|2|\n\nAfter",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "Before"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "After"
        );
      }
    });

    it("should handle alignment with existing mixed formats", async () => {
      const result = await executeTool(markdownTableFormatter, {
        input: "|A|B|C|\n|:---|:---:|---:|\n|1|2|3|",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Should preserve mixed alignments
        expect((result.data as Record<string, unknown>).tablesFormatted).toBe(
          1
        );
      }
    });

    it("should handle complex table", async () => {
      const table = `| Feature | Support | Notes |
|---------|---------|-------|
| Basic | Yes | Works well |
| Advanced | Partial | Some limitations |
| Experimental | No | Coming soon |`;

      const result = await executeTool(markdownTableFormatter, {
        input: table,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).tablesFormatted).toBe(
          1
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Feature"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Basic"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Experimental"
        );
      }
    });
  });
});
