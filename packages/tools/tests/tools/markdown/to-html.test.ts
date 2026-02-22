import { describe, it, expect } from "vitest";
import { markdownToHtml } from "../../../src/tools/markdown/to-html";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("markdownToHtml", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(markdownToHtml.meta.id).toBe("markdown/to-html");
      expect(markdownToHtml.meta.name).toBe("Markdown to HTML");
      expect(markdownToHtml.meta.category).toBe("markdown");
      expect(markdownToHtml.meta.tier).toBe(ToolTier.CLIENT);
      expect(markdownToHtml.meta.keywords).toContain("html");
      expect(markdownToHtml.meta.keywords).toContain("gfm");
    });
  });

  describe("execute", () => {
    it("should convert headers to HTML", async () => {
      const result = await executeTool(markdownToHtml, {
        input: "# Heading 1\n## Heading 2",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).html).toContain(
          "<h1>Heading 1</h1>"
        );
        expect((result.data as Record<string, unknown>).html).toContain(
          "<h2>Heading 2</h2>"
        );
      }
    });

    it("should convert all header levels", async () => {
      const result = await executeTool(markdownToHtml, {
        input: "### H3\n#### H4\n##### H5\n###### H6",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).html).toContain(
          "<h3>H3</h3>"
        );
        expect((result.data as Record<string, unknown>).html).toContain(
          "<h4>H4</h4>"
        );
        expect((result.data as Record<string, unknown>).html).toContain(
          "<h5>H5</h5>"
        );
        expect((result.data as Record<string, unknown>).html).toContain(
          "<h6>H6</h6>"
        );
      }
    });

    it("should convert bold text", async () => {
      const result = await executeTool(markdownToHtml, {
        input: "This is **bold** text",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).html).toContain(
          "<strong>bold</strong>"
        );
      }
    });

    it("should convert italic text", async () => {
      const result = await executeTool(markdownToHtml, {
        input: "This is *italic* text",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).html).toContain(
          "<em>italic</em>"
        );
      }
    });

    it("should convert strikethrough (GFM)", async () => {
      const result = await executeTool(markdownToHtml, {
        input: "This is ~~deleted~~ text",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).html).toContain(
          "<del>deleted</del>"
        );
      }
    });

    it("should convert inline code", async () => {
      const result = await executeTool(markdownToHtml, {
        input: "Use `code` here",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).html).toContain(
          "<code>code</code>"
        );
      }
    });

    it("should convert code blocks", async () => {
      const result = await executeTool(markdownToHtml, {
        input: "```\nconst x = 1;\n```",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).html).toContain(
          "<pre>"
        );
        expect((result.data as Record<string, unknown>).html).toContain(
          "<code>"
        );
        expect((result.data as Record<string, unknown>).html).toContain(
          "const x = 1;"
        );
      }
    });

    it("should convert code blocks with language", async () => {
      const result = await executeTool(markdownToHtml, {
        input: "```javascript\nconst x = 1;\n```",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).html).toContain(
          "<pre>"
        );
        expect((result.data as Record<string, unknown>).html).toContain(
          'class="language-javascript"'
        );
        expect((result.data as Record<string, unknown>).html).toContain(
          "const x = 1;"
        );
      }
    });

    it("should convert links", async () => {
      const result = await executeTool(markdownToHtml, {
        input: "[Click here](https://example.com)",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).html).toContain(
          '<a href="https://example.com">Click here</a>'
        );
      }
    });

    it("should convert images", async () => {
      const result = await executeTool(markdownToHtml, {
        input: "![Alt text](https://example.com/image.png)",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).html).toContain(
          '<img src="https://example.com/image.png"'
        );
        expect((result.data as Record<string, unknown>).html).toContain(
          'alt="Alt text"'
        );
      }
    });

    it("should convert unordered lists", async () => {
      const result = await executeTool(markdownToHtml, {
        input: "- Item 1\n- Item 2\n- Item 3",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).html).toContain("<ul>");
        expect((result.data as Record<string, unknown>).html).toContain(
          "<li>Item 1</li>"
        );
        expect((result.data as Record<string, unknown>).html).toContain(
          "<li>Item 2</li>"
        );
        expect((result.data as Record<string, unknown>).html).toContain(
          "<li>Item 3</li>"
        );
        expect((result.data as Record<string, unknown>).html).toContain(
          "</ul>"
        );
      }
    });

    it("should convert ordered lists", async () => {
      const result = await executeTool(markdownToHtml, {
        input: "1. First\n2. Second\n3. Third",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).html).toContain("<ol>");
        expect((result.data as Record<string, unknown>).html).toContain(
          "<li>First</li>"
        );
        expect((result.data as Record<string, unknown>).html).toContain(
          "<li>Second</li>"
        );
        expect((result.data as Record<string, unknown>).html).toContain(
          "<li>Third</li>"
        );
        expect((result.data as Record<string, unknown>).html).toContain(
          "</ol>"
        );
      }
    });

    it("should convert blockquotes", async () => {
      const result = await executeTool(markdownToHtml, {
        input: "> This is a quote",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).html).toContain(
          "<blockquote>"
        );
        expect((result.data as Record<string, unknown>).html).toContain(
          "This is a quote"
        );
        expect((result.data as Record<string, unknown>).html).toContain(
          "</blockquote>"
        );
      }
    });

    it("should convert horizontal rules", async () => {
      const result = await executeTool(markdownToHtml, {
        input: "Before\n\n---\n\nAfter",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // With proper spacing, marked treats --- as HR
        expect((result.data as Record<string, unknown>).html).toContain("<hr");
      }
    });

    it("should convert tables (GFM)", async () => {
      const result = await executeTool(markdownToHtml, {
        input:
          "| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1 | Cell 2 |",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).html).toContain(
          "<table>"
        );
        expect((result.data as Record<string, unknown>).html).toContain(
          "<thead>"
        );
        expect((result.data as Record<string, unknown>).html).toContain(
          "<tbody>"
        );
        expect((result.data as Record<string, unknown>).html).toContain(
          "<th>Header 1</th>"
        );
        expect((result.data as Record<string, unknown>).html).toContain(
          "<td>Cell 1</td>"
        );
      }
    });

    it("should convert task lists (GFM)", async () => {
      const result = await executeTool(markdownToHtml, {
        input: "- [x] Completed\n- [ ] Pending",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).html).toContain(
          'type="checkbox"'
        );
        expect((result.data as Record<string, unknown>).html).toContain(
          "checked"
        );
        expect((result.data as Record<string, unknown>).html).toContain(
          "Completed"
        );
        expect((result.data as Record<string, unknown>).html).toContain(
          "Pending"
        );
      }
    });

    it("should enable GFM by default", async () => {
      const result = await executeTool(markdownToHtml, {
        input: "~~strikethrough~~",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).html).toContain(
          "<del>"
        );
      }
    });

    it("should disable GFM when option is false", async () => {
      const result = await executeTool(
        markdownToHtml,
        { input: "~~strikethrough~~" },
        { gfm: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).html).not.toContain(
          "<del>"
        );
      }
    });

    it("should convert line breaks when breaks option is true", async () => {
      const result = await executeTool(
        markdownToHtml,
        { input: "Line 1\nLine 2" },
        { breaks: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).html).toContain("<br");
      }
    });

    it("should not convert line breaks by default", async () => {
      const result = await executeTool(markdownToHtml, {
        input: "Line 1\nLine 2",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).html).not.toContain(
          "<br>"
        );
      }
    });

    it("should sanitize HTML when option is true", async () => {
      const result = await executeTool(
        markdownToHtml,
        { input: '<script>alert("xss")</script>' },
        { sanitize: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).html).not.toContain(
          "<script>"
        );
      }
    });

    it("should remove event handlers when sanitizing", async () => {
      const result = await executeTool(
        markdownToHtml,
        { input: '<div onclick="alert(1)">Test</div>' },
        { sanitize: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).html).not.toContain(
          "onclick"
        );
      }
    });

    it("should remove javascript URLs when sanitizing", async () => {
      const result = await executeTool(
        markdownToHtml,
        { input: '<a href="javascript:alert(1)">Link</a>' },
        { sanitize: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).html).not.toContain(
          "javascript:"
        );
      }
    });

    it("should handle empty input", async () => {
      const result = await executeTool(markdownToHtml, {
        input: "",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).html).toBe("");
      }
    });

    it("should wrap paragraphs in p tags", async () => {
      const result = await executeTool(markdownToHtml, {
        input: "First paragraph\n\nSecond paragraph",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).html).toContain(
          "<p>First paragraph</p>"
        );
        expect((result.data as Record<string, unknown>).html).toContain(
          "<p>Second paragraph</p>"
        );
      }
    });

    it("should handle nested lists", async () => {
      const result = await executeTool(markdownToHtml, {
        input: "- Item 1\n  - Nested 1\n  - Nested 2\n- Item 2",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).html).toContain("<ul>");
        expect((result.data as Record<string, unknown>).html).toContain(
          "<li>Item 1"
        );
        expect((result.data as Record<string, unknown>).html).toContain(
          "<li>Nested 1</li>"
        );
      }
    });

    it("should handle complex document", async () => {
      const markdown = `# Title

This is a **bold** and *italic* paragraph.

## Code Example

\`\`\`javascript
const x = 1;
\`\`\`

## Features

- Feature 1
- Feature 2

> A blockquote

[Link](https://example.com)

| Col1 | Col2 |
|------|------|
| A    | B    |`;

      const result = await executeTool(markdownToHtml, { input: markdown });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).html).toContain(
          "<h1>Title</h1>"
        );
        expect((result.data as Record<string, unknown>).html).toContain(
          "<strong>bold</strong>"
        );
        expect((result.data as Record<string, unknown>).html).toContain(
          "<em>italic</em>"
        );
        expect((result.data as Record<string, unknown>).html).toContain(
          "<h2>Code Example</h2>"
        );
        expect((result.data as Record<string, unknown>).html).toContain(
          "<pre>"
        );
        expect((result.data as Record<string, unknown>).html).toContain(
          "<h2>Features</h2>"
        );
        expect((result.data as Record<string, unknown>).html).toContain("<ul>");
        expect((result.data as Record<string, unknown>).html).toContain(
          "<blockquote>"
        );
        expect((result.data as Record<string, unknown>).html).toContain(
          "<a href"
        );
        expect((result.data as Record<string, unknown>).html).toContain(
          "<table>"
        );
      }
    });

    it("should combine all options", async () => {
      const result = await executeTool(
        markdownToHtml,
        { input: "Line 1\nLine 2\n\n~~text~~\n\n<script>bad</script>" },
        { gfm: true, breaks: true, sanitize: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).html).toContain("<br");
        expect((result.data as Record<string, unknown>).html).toContain(
          "<del>text</del>"
        );
        expect((result.data as Record<string, unknown>).html).not.toContain(
          "<script>"
        );
      }
    });
  });
});
