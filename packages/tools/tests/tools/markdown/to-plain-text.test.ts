import { describe, it, expect } from "vitest";
import { markdownToPlainText } from "../../../src/tools/markdown/to-plain-text";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("markdownToPlainText", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(markdownToPlainText.meta.id).toBe("markdown/to-plain-text");
      expect(markdownToPlainText.meta.name).toBe("Markdown to Plain Text");
      expect(markdownToPlainText.meta.category).toBe("markdown");
      expect(markdownToPlainText.meta.tier).toBe(ToolTier.CLIENT);
      expect(markdownToPlainText.meta.keywords).toContain("plain");
      expect(markdownToPlainText.meta.keywords).toContain("strip");
    });
  });

  describe("execute", () => {
    it("should strip headers", async () => {
      const result = await executeTool(markdownToPlainText, {
        input: "# Heading 1\n## Heading 2\n### Heading 3",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "Heading 1"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Heading 2"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Heading 3"
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "#"
        );
      }
    });

    it("should strip bold formatting", async () => {
      const result = await executeTool(markdownToPlainText, {
        input: "This is **bold** and __also bold__ text",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "bold"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "also bold"
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "**"
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "__"
        );
      }
    });

    it("should strip italic formatting", async () => {
      const result = await executeTool(markdownToPlainText, {
        input: "This is *italic* and _also italic_ text",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "italic"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "also italic"
        );
      }
    });

    it("should strip strikethrough", async () => {
      const result = await executeTool(markdownToPlainText, {
        input: "This is ~~deleted~~ text",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "deleted"
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "~~"
        );
      }
    });

    it("should strip inline code", async () => {
      const result = await executeTool(markdownToPlainText, {
        input: "Use `code` here",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "code"
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "`"
        );
      }
    });

    it("should remove code blocks entirely", async () => {
      const result = await executeTool(markdownToPlainText, {
        input: "Before\n```javascript\nconst x = 1;\n```\nAfter",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "Before"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "After"
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "const x"
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "```"
        );
      }
    });

    it("should extract link text and remove URL", async () => {
      const result = await executeTool(markdownToPlainText, {
        input: "[Click here](https://example.com) for more",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "Click here"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "for more"
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "https://example.com"
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "["
        );
      }
    });

    it("should extract image alt text and remove URL", async () => {
      const result = await executeTool(markdownToPlainText, {
        input: "![Alt text](https://example.com/image.png)",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "Alt text"
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "https://example.com"
        );
      }
    });

    it("should strip list markers", async () => {
      const result = await executeTool(markdownToPlainText, {
        input: "- Item 1\n- Item 2\n* Item 3\n+ Item 4",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "Item 1"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Item 2"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Item 3"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Item 4"
        );
      }
    });

    it("should strip ordered list markers", async () => {
      const result = await executeTool(markdownToPlainText, {
        input: "1. First\n2. Second\n3. Third",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "First"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Second"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Third"
        );
        expect((result.data as Record<string, unknown>).output).not.toMatch(
          /^\d+\./m
        );
      }
    });

    it("should strip blockquote markers", async () => {
      const result = await executeTool(markdownToPlainText, {
        input: "> This is a quote",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "This is a quote"
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          ">"
        );
      }
    });

    it("should remove horizontal rules", async () => {
      const result = await executeTool(markdownToPlainText, {
        input: "Before\n---\nAfter",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "Before"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "After"
        );
        expect((result.data as Record<string, unknown>).output).not.toMatch(
          /^---$/m
        );
      }
    });

    it("should remove HTML tags", async () => {
      const result = await executeTool(markdownToPlainText, {
        input: "<div>Content</div><br><span>More</span>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "Content"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "More"
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "<"
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          ">"
        );
      }
    });

    it("should remove frontmatter", async () => {
      const result = await executeTool(markdownToPlainText, {
        input: "---\ntitle: Test\nauthor: Me\n---\nContent here",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "Content here"
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "title: Test"
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "author: Me"
        );
      }
    });

    it("should strip task list markers", async () => {
      const result = await executeTool(markdownToPlainText, {
        input: "- [x] Completed\n- [ ] Pending",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "Completed"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Pending"
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "[x]"
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "[ ]"
        );
      }
    });

    it("should handle reference-style links", async () => {
      const result = await executeTool(markdownToPlainText, {
        input: "[link text][ref]\n\n[ref]: https://example.com",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "link text"
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "https://example.com"
        );
      }
    });

    it("should remove footnotes", async () => {
      const result = await executeTool(markdownToPlainText, {
        input: "Text[^1] here\n\n[^1]: Footnote content",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "Text"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "here"
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "[^1]"
        );
      }
    });

    it("should handle table content", async () => {
      const result = await executeTool(markdownToPlainText, {
        input:
          "| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1 | Cell 2 |",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "Header 1"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Cell 1"
        );
      }
    });

    it("should return character count", async () => {
      const result = await executeTool(markdownToPlainText, {
        input: "Hello World",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).charCount).toBe(11);
      }
    });

    it("should return word count", async () => {
      const result = await executeTool(markdownToPlainText, {
        input: "Hello World Test",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).wordCount).toBe(3);
      }
    });

    it("should handle empty input", async () => {
      const result = await executeTool(markdownToPlainText, {
        input: "",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe("");
        expect((result.data as Record<string, unknown>).charCount).toBe(0);
        expect((result.data as Record<string, unknown>).wordCount).toBe(0);
      }
    });

    it("should normalize whitespace", async () => {
      const result = await executeTool(markdownToPlainText, {
        input: "Line 1\n\n\n\n\nLine 2",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).not.toMatch(
          /\n{3,}/
        );
      }
    });

    it("should strip highlight markers", async () => {
      const result = await executeTool(markdownToPlainText, {
        input: "This is ==highlighted== text",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "highlighted"
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "=="
        );
      }
    });

    it("should strip subscript and superscript", async () => {
      const result = await executeTool(markdownToPlainText, {
        input: "H~2~O and E=mc^2^",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain("H");
        expect((result.data as Record<string, unknown>).output).toContain("2");
        expect((result.data as Record<string, unknown>).output).toContain("O");
      }
    });

    it("should handle complex document", async () => {
      const markdown = `---
title: Test Document
---

# Main Title

This is **bold** and *italic* text with a [link](https://example.com).

## Section

- Item 1
- Item 2

\`\`\`javascript
const x = 1;
\`\`\`

> A blockquote

![Image](https://example.com/img.png)

| A | B |
|---|---|
| 1 | 2 |`;

      const result = await executeTool(markdownToPlainText, {
        input: markdown,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "Main Title"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "bold"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "italic"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "link"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Section"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Item 1"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "A blockquote"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Image"
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "---"
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "**"
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "*"
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "["
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "```"
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          ">"
        );
        expect(
          (result.data as Record<string, unknown>).charCount
        ).toBeGreaterThan(0);
        expect(
          (result.data as Record<string, unknown>).wordCount
        ).toBeGreaterThan(0);
      }
    });

    it("should handle setext-style headers", async () => {
      const result = await executeTool(markdownToPlainText, {
        input: "Header\n======\nText",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "Header"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Text"
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "="
        );
      }
    });

    it("should handle bold italic combination", async () => {
      const result = await executeTool(markdownToPlainText, {
        input: "This is ***bold italic*** and ___also bold italic___",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "bold italic"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "also bold italic"
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "***"
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "___"
        );
      }
    });
  });
});
