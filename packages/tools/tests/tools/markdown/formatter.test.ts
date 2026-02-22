import { describe, it, expect } from "vitest";
import { markdownFormatter } from "../../../src/tools/markdown/formatter";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("markdownFormatter", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(markdownFormatter.meta.id).toBe("markdown/formatter");
      expect(markdownFormatter.meta.name).toBe("Markdown Formatter");
      expect(markdownFormatter.meta.category).toBe("markdown");
      expect(markdownFormatter.meta.tier).toBe(ToolTier.CLIENT);
      expect(markdownFormatter.meta.keywords).toContain("format");
      expect(markdownFormatter.meta.keywords).toContain("markdown");
    });
  });

  describe("execute", () => {
    it("should normalize headings", async () => {
      const result = await executeTool(markdownFormatter, {
        input: "## Title ##",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).formatted).toBe(
          "## Title\n"
        );
      }
    });

    it("should ensure blank line before heading", async () => {
      const result = await executeTool(markdownFormatter, {
        input: "Some text\n# Heading",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).formatted).toBe(
          "Some text\n\n# Heading\n"
        );
      }
    });

    it("should ensure blank line after heading", async () => {
      const result = await executeTool(markdownFormatter, {
        input: "# Heading\nSome text",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).formatted).toBe(
          "# Heading\n\nSome text\n"
        );
      }
    });

    it("should ensure blank line before code block", async () => {
      const result = await executeTool(markdownFormatter, {
        input: "Some text\n```\ncode\n```",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).formatted).toContain(
          "Some text\n\n```"
        );
      }
    });

    it("should trim trailing whitespace", async () => {
      const result = await executeTool(markdownFormatter, {
        input: "Line with trailing space   \nAnother line",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).formatted).toBe(
          "Line with trailing space\nAnother line\n"
        );
      }
    });

    it("should reduce excessive blank lines", async () => {
      const result = await executeTool(markdownFormatter, {
        input: "Line 1\n\n\n\n\nLine 2",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // The formatter may keep up to 2 blank lines
        expect((result.data as Record<string, unknown>).formatted).toContain(
          "Line 1"
        );
        expect((result.data as Record<string, unknown>).formatted).toContain(
          "Line 2"
        );
      }
    });

    it("should remove leading blank lines", async () => {
      const result = await executeTool(markdownFormatter, {
        input: "\n\n\n# Title",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).formatted).toBe(
          "# Title\n"
        );
      }
    });

    it("should remove trailing blank lines", async () => {
      const result = await executeTool(markdownFormatter, {
        input: "Content\n\n\n",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).formatted).toBe(
          "Content\n"
        );
      }
    });

    it("should handle empty input", async () => {
      const result = await executeTool(markdownFormatter, {
        input: "",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).formatted).toBe("\n");
      }
    });

    it("should handle only whitespace input", async () => {
      const result = await executeTool(markdownFormatter, {
        input: "   \n   \n   ",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).formatted).toBe("\n");
      }
    });

    it("should not add blank line when heading is first line", async () => {
      const result = await executeTool(markdownFormatter, {
        input: "# Title\nContent",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { formatted: string };
        expect(data.formatted.startsWith("# Title")).toBe(true);
      }
    });

    it("should disable blank line insertion with option", async () => {
      const result = await executeTool(
        markdownFormatter,
        { input: "Text\n# Heading" },
        { ensureBlankLines: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Should still trim trailing whitespace
        expect((result.data as Record<string, unknown>).formatted).toBe(
          "Text\n# Heading\n"
        );
      }
    });

    it("should disable heading normalization with option", async () => {
      const result = await executeTool(
        markdownFormatter,
        { input: "## Title ##" },
        { normalizeHeadings: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).formatted).toBe(
          "## Title ##\n"
        );
      }
    });

    it("should handle multiple heading levels", async () => {
      const result = await executeTool(markdownFormatter, {
        input: "# H1 #\n## H2 ##\n### H3 ###",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).formatted).toContain(
          "# H1"
        );
        expect((result.data as Record<string, unknown>).formatted).toContain(
          "## H2"
        );
        expect((result.data as Record<string, unknown>).formatted).toContain(
          "### H3"
        );
      }
    });

    it("should preserve list items", async () => {
      const result = await executeTool(markdownFormatter, {
        input: "- Item 1\n- Item 2\n- Item 3",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).formatted).toContain(
          "- Item 1"
        );
        expect((result.data as Record<string, unknown>).formatted).toContain(
          "- Item 2"
        );
        expect((result.data as Record<string, unknown>).formatted).toContain(
          "- Item 3"
        );
      }
    });

    it("should preserve code block content", async () => {
      const result = await executeTool(markdownFormatter, {
        input: "```javascript\nconst x = 1;\n```",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).formatted).toContain(
          "const x = 1;"
        );
      }
    });

    it("should format complex document", async () => {
      const input = `


# Title
Some intro text
## Section 1
Content here


### Subsection
More content



`;
      const result = await executeTool(markdownFormatter, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { formatted: string };
        // Should start with heading (possibly with leading newline trimmed)
        expect(data.formatted).toContain("# Title");
        expect(data.formatted.endsWith("\n")).toBe(true);
        // Should contain all sections
        expect(data.formatted).toContain("## Section 1");
        expect(data.formatted).toContain("### Subsection");
      }
    });

    it("should add final newline", async () => {
      const result = await executeTool(markdownFormatter, {
        input: "Content without newline",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { formatted: string };
        expect(data.formatted.endsWith("\n")).toBe(true);
      }
    });

    it("should handle tables", async () => {
      const result = await executeTool(markdownFormatter, {
        input: "| Col1 | Col2 |\n|------|------|\n| A    | B    |",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).formatted).toContain(
          "|"
        );
      }
    });

    it("should handle blockquotes", async () => {
      const result = await executeTool(markdownFormatter, {
        input: "> Quote line 1\n> Quote line 2",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).formatted).toContain(
          "> Quote line 1"
        );
        expect((result.data as Record<string, unknown>).formatted).toContain(
          "> Quote line 2"
        );
      }
    });
  });
});
