import { describe, it, expect } from "vitest";
import { htmlToMarkdown } from "../../../src/tools/markdown/from-html";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("htmlToMarkdown", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(htmlToMarkdown.meta.id).toBe("markdown/from-html");
      expect(htmlToMarkdown.meta.name).toBe("HTML to Markdown");
      expect(htmlToMarkdown.meta.category).toBe("markdown");
      expect(htmlToMarkdown.meta.tier).toBe(ToolTier.CLIENT);
      expect(htmlToMarkdown.meta.keywords).toContain("html");
      expect(htmlToMarkdown.meta.keywords).toContain("markdown");
    });
  });

  describe("execute", () => {
    it("should convert headings", async () => {
      const result = await executeTool(htmlToMarkdown, {
        input: "<h1>Title</h1><h2>Subtitle</h2><h3>Section</h3>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).markdown).toContain(
          "# Title"
        );
        expect((result.data as Record<string, unknown>).markdown).toContain(
          "## Subtitle"
        );
        expect((result.data as Record<string, unknown>).markdown).toContain(
          "### Section"
        );
      }
    });

    it("should convert bold text", async () => {
      const result = await executeTool(htmlToMarkdown, {
        input: "<strong>bold</strong> and <b>also bold</b>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).markdown).toContain(
          "**bold**"
        );
        expect((result.data as Record<string, unknown>).markdown).toContain(
          "**also bold**"
        );
      }
    });

    it("should convert italic text", async () => {
      const result = await executeTool(htmlToMarkdown, {
        input: "<em>italic</em> and <i>also italic</i>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).markdown).toContain(
          "_italic_"
        );
        expect((result.data as Record<string, unknown>).markdown).toContain(
          "_also italic_"
        );
      }
    });

    it("should convert links", async () => {
      const result = await executeTool(htmlToMarkdown, {
        input: '<a href="https://example.com">Link text</a>',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).markdown).toContain(
          "[Link text](https://example.com)"
        );
      }
    });

    it("should convert images", async () => {
      const result = await executeTool(htmlToMarkdown, {
        input: '<img src="image.png" alt="Alt text">',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).markdown).toContain(
          "![Alt text](image.png)"
        );
      }
    });

    it("should convert unordered lists", async () => {
      const result = await executeTool(htmlToMarkdown, {
        input: "<ul><li>Item 1</li><li>Item 2</li></ul>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).markdown).toContain(
          "Item 1"
        );
        expect((result.data as Record<string, unknown>).markdown).toContain(
          "Item 2"
        );
        // Lists use dash or other marker
        expect((result.data as Record<string, unknown>).markdown).toMatch(
          /[-*+]\s+Item 1/
        );
      }
    });

    it("should convert ordered lists", async () => {
      const result = await executeTool(htmlToMarkdown, {
        input: "<ol><li>First</li><li>Second</li></ol>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).markdown).toContain(
          "First"
        );
        expect((result.data as Record<string, unknown>).markdown).toContain(
          "Second"
        );
        // Ordered list markers
        expect((result.data as Record<string, unknown>).markdown).toMatch(
          /\d+\.\s+First/
        );
      }
    });

    it("should convert blockquotes", async () => {
      const result = await executeTool(htmlToMarkdown, {
        input: "<blockquote>Quoted text</blockquote>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).markdown).toContain(
          "> Quoted text"
        );
      }
    });

    it("should convert code elements", async () => {
      const result = await executeTool(htmlToMarkdown, {
        input: "<code>inline code</code>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).markdown).toContain(
          "`inline code`"
        );
      }
    });

    it("should convert pre elements to code blocks", async () => {
      const result = await executeTool(htmlToMarkdown, {
        input: "<pre><code>code block\nline 2</code></pre>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).markdown).toContain(
          "```"
        );
        expect((result.data as Record<string, unknown>).markdown).toContain(
          "code block"
        );
      }
    });

    it("should convert horizontal rules", async () => {
      const result = await executeTool(htmlToMarkdown, {
        input: "<p>Before</p><hr><p>After</p>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).markdown).toContain(
          "Before"
        );
        expect((result.data as Record<string, unknown>).markdown).toContain(
          "After"
        );
        // HR may be represented with various markers
        expect((result.data as Record<string, unknown>).markdown).toMatch(
          /---|\*\s*\*\s*\*|___/
        );
      }
    });

    it("should convert paragraphs", async () => {
      const result = await executeTool(htmlToMarkdown, {
        input: "<p>Paragraph 1</p><p>Paragraph 2</p>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).markdown).toContain(
          "Paragraph 1"
        );
        expect((result.data as Record<string, unknown>).markdown).toContain(
          "Paragraph 2"
        );
      }
    });

    it("should use setext heading style when configured", async () => {
      const result = await executeTool(
        htmlToMarkdown,
        { input: "<h1>Title</h1><h2>Subtitle</h2>" },
        { headingStyle: "setext" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).markdown).toContain(
          "Title\n="
        );
        expect((result.data as Record<string, unknown>).markdown).toContain(
          "Subtitle\n-"
        );
      }
    });

    it("should use custom bullet marker", async () => {
      const result = await executeTool(
        htmlToMarkdown,
        { input: "<ul><li>Item</li></ul>" },
        { bulletListMarker: "*" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).markdown).toContain(
          "Item"
        );
        // May have extra spacing
        expect((result.data as Record<string, unknown>).markdown).toMatch(
          /\*\s+Item/
        );
      }
    });

    it("should use indented code style when configured", async () => {
      const result = await executeTool(
        htmlToMarkdown,
        { input: "<pre><code>code</code></pre>" },
        { codeBlockStyle: "indented" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).markdown).toContain(
          "    code"
        );
      }
    });

    it("should handle empty input", async () => {
      const result = await executeTool(htmlToMarkdown, {
        input: "",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).markdown).toBe("");
      }
    });

    it("should handle nested elements", async () => {
      const result = await executeTool(htmlToMarkdown, {
        input: "<p><strong><em>Bold italic</em></strong></p>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).markdown).toContain(
          "**_Bold italic_**"
        );
      }
    });

    it("should handle complex HTML document", async () => {
      const html = `
        <h1>Document Title</h1>
        <p>Introduction <strong>text</strong>.</p>
        <h2>Section</h2>
        <ul>
          <li>Item <em>one</em></li>
          <li>Item two</li>
        </ul>
        <blockquote>A quote</blockquote>
        <pre><code>const x = 1;</code></pre>
      `;

      const result = await executeTool(htmlToMarkdown, { input: html });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).markdown).toContain(
          "# Document Title"
        );
        expect((result.data as Record<string, unknown>).markdown).toContain(
          "**text**"
        );
        expect((result.data as Record<string, unknown>).markdown).toContain(
          "## Section"
        );
        expect((result.data as Record<string, unknown>).markdown).toContain(
          "_one_"
        );
        expect((result.data as Record<string, unknown>).markdown).toContain(
          "> A quote"
        );
        expect((result.data as Record<string, unknown>).markdown).toContain(
          "const x = 1;"
        );
      }
    });

    it("should handle tables", async () => {
      const html = `
        <table>
          <tr><th>Header 1</th><th>Header 2</th></tr>
          <tr><td>Cell 1</td><td>Cell 2</td></tr>
        </table>
      `;

      const result = await executeTool(htmlToMarkdown, { input: html });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).markdown).toContain(
          "Header 1"
        );
        expect((result.data as Record<string, unknown>).markdown).toContain(
          "Cell 1"
        );
      }
    });

    it("should strip script tags", async () => {
      const result = await executeTool(htmlToMarkdown, {
        input: "<p>Text</p><script>alert('xss')</script>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).markdown).toContain(
          "Text"
        );
        // Script tags should be removed or minimized
        expect((result.data as Record<string, unknown>).markdown).not.toContain(
          "<script>"
        );
      }
    });

    it("should handle br tags", async () => {
      const result = await executeTool(htmlToMarkdown, {
        input: "<p>Line 1<br>Line 2</p>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).markdown).toContain(
          "Line 1"
        );
        expect((result.data as Record<string, unknown>).markdown).toContain(
          "Line 2"
        );
      }
    });
  });
});
