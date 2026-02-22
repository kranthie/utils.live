import { describe, it, expect } from "vitest";
import { markdownEscaper } from "../../../src/tools/markdown/escaper";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("markdownEscaper", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(markdownEscaper.meta.id).toBe("markdown/escaper");
      expect(markdownEscaper.meta.name).toBe("Markdown Escaper");
      expect(markdownEscaper.meta.category).toBe("markdown");
      expect(markdownEscaper.meta.tier).toBe(ToolTier.CLIENT);
      expect(markdownEscaper.meta.keywords).toContain("escape");
      expect(markdownEscaper.meta.keywords).toContain("markdown");
    });
  });

  describe("execute", () => {
    it("should escape asterisks", async () => {
      const result = await executeTool(markdownEscaper, {
        input: "*bold* and *italic*",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "\\*bold\\* and \\*italic\\*"
        );
        expect((result.data as Record<string, unknown>).escapedCount).toBe(4);
      }
    });

    it("should escape underscores", async () => {
      const result = await executeTool(markdownEscaper, {
        input: "_italic_ text",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "\\_italic\\_ text"
        );
        expect((result.data as Record<string, unknown>).escapedCount).toBe(2);
      }
    });

    it("should escape hash symbols", async () => {
      const result = await executeTool(markdownEscaper, {
        input: "# Header",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "\\# Header"
        );
      }
    });

    it("should escape backticks", async () => {
      const result = await executeTool(markdownEscaper, {
        input: "`code`",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "\\`code\\`"
        );
      }
    });

    it("should escape square brackets", async () => {
      const result = await executeTool(markdownEscaper, {
        input: "[link](url)",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "\\["
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "\\]"
        );
      }
    });

    it("should escape parentheses", async () => {
      const result = await executeTool(markdownEscaper, {
        input: "(text)",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "\\(text\\)"
        );
      }
    });

    it("should escape angle brackets", async () => {
      const result = await executeTool(markdownEscaper, {
        input: "<html>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "\\<html\\>"
        );
      }
    });

    it("should escape pipes (table syntax)", async () => {
      const result = await executeTool(markdownEscaper, {
        input: "| col1 | col2 |",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "\\| col1 \\| col2 \\|"
        );
      }
    });

    it("should escape tildes (strikethrough)", async () => {
      const result = await executeTool(markdownEscaper, {
        input: "~~deleted~~",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "\\~\\~deleted\\~\\~"
        );
      }
    });

    it("should escape backslashes", async () => {
      const result = await executeTool(markdownEscaper, {
        input: "path\\to\\file",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "path\\\\to\\\\file"
        );
      }
    });

    it("should escape exclamation marks", async () => {
      const result = await executeTool(markdownEscaper, {
        input: "![alt](image.png)",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "\\!"
        );
      }
    });

    it("should escape only specified characters when provided", async () => {
      const result = await executeTool(
        markdownEscaper,
        { input: "*bold* and # header" },
        { characters: ["*"] }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "\\*bold\\* and # header"
        );
        expect((result.data as Record<string, unknown>).escapedCount).toBe(2);
      }
    });

    it("should handle empty input", async () => {
      const result = await executeTool(markdownEscaper, {
        input: "",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe("");
        expect((result.data as Record<string, unknown>).escapedCount).toBe(0);
      }
    });

    it("should handle text with no special characters", async () => {
      const result = await executeTool(markdownEscaper, {
        input: "Plain text without special characters",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "Plain text without special characters"
        );
        expect((result.data as Record<string, unknown>).escapedCount).toBe(0);
      }
    });

    it("should escape multiple character types", async () => {
      const result = await executeTool(markdownEscaper, {
        input: "**bold** and `code` with [link](url)",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "\\*\\*bold\\*\\*"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "\\`code\\`"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "\\[link\\]"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "\\(url\\)"
        );
      }
    });

    it("should escape curly braces", async () => {
      const result = await executeTool(markdownEscaper, {
        input: "{variable}",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "\\{variable\\}"
        );
      }
    });

    it("should escape plus signs", async () => {
      const result = await executeTool(markdownEscaper, {
        input: "+ list item",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "\\+ list item"
        );
      }
    });

    it("should escape dashes", async () => {
      const result = await executeTool(markdownEscaper, {
        input: "- list item",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "\\- list item"
        );
      }
    });

    it("should escape periods (ordered list)", async () => {
      const result = await executeTool(markdownEscaper, {
        input: "1. item",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "\\."
        );
      }
    });

    it("should return correct escaped count", async () => {
      const result = await executeTool(markdownEscaper, {
        input: "***",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).escapedCount).toBe(3);
      }
    });

    it("should handle complex markdown document", async () => {
      const input = `# Title
**Bold** and *italic*
- List item
[Link](https://example.com)
![Image](img.png)`;

      const result = await executeTool(markdownEscaper, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          (result.data as Record<string, unknown>).escapedCount
        ).toBeGreaterThan(10);
        expect((result.data as Record<string, unknown>).output).toContain(
          "\\#"
        );
      }
    });

    it("should filter out invalid characters in options", async () => {
      const result = await executeTool(
        markdownEscaper,
        { input: "**bold**" },
        { characters: ["*", "invalid-string"] }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Should only escape * (single chars)
        expect((result.data as Record<string, unknown>).output).toBe(
          "\\*\\*bold\\*\\*"
        );
      }
    });
  });
});
