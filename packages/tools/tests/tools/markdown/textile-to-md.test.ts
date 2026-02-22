import { describe, it, expect } from "vitest";
import { textileToMd } from "../../../src/tools/markdown/textile-to-md";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("textileToMd", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(textileToMd.meta.id).toBe("markdown/textile-to-md");
      expect(textileToMd.meta.name).toBe("Textile to Markdown");
      expect(textileToMd.meta.category).toBe("markdown");
      expect(textileToMd.meta.tier).toBe(ToolTier.CLIENT);
      expect(textileToMd.meta.keywords).toContain("textile");
      expect(textileToMd.meta.keywords).toContain("markdown");
    });
  });

  describe("execute", () => {
    it("should convert h1 header", async () => {
      const result = await executeTool(textileToMd, {
        input: "h1. Title",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Check header is converted
        expect((result.data as Record<string, unknown>).output).toContain(
          "Title"
        );
      }
    });

    it("should convert h2 header", async () => {
      const result = await executeTool(textileToMd, {
        input: "h2. Subtitle",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Check header is converted
        expect((result.data as Record<string, unknown>).output).toContain(
          "Subtitle"
        );
      }
    });

    it("should convert h3 to h6 headers", async () => {
      const result = await executeTool(textileToMd, {
        input: "h3. Section\nh4. Subsection\nh5. Detail\nh6. Smallest",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "Section"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Subsection"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Detail"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Smallest"
        );
      }
    });

    it("should convert bold text", async () => {
      const result = await executeTool(textileToMd, {
        input: "This is *bold* text",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "**bold**"
        );
      }
    });

    it("should convert italic text", async () => {
      const result = await executeTool(textileToMd, {
        input: "This is _italic_ text",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "*italic*"
        );
      }
    });

    it("should convert strikethrough text", async () => {
      const result = await executeTool(textileToMd, {
        input: "This is -deleted- text",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Check deleted text is present
        expect((result.data as Record<string, unknown>).output).toContain(
          "deleted"
        );
      }
    });

    it("should convert underline text", async () => {
      const result = await executeTool(textileToMd, {
        input: "This is +underlined+ text",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Check underlined text is present
        expect((result.data as Record<string, unknown>).output).toContain(
          "underlined"
        );
      }
    });

    it("should convert superscript", async () => {
      const result = await executeTool(textileToMd, {
        input: "E = mc^2^",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Check superscript content is present
        expect((result.data as Record<string, unknown>).output).toContain("2");
      }
    });

    it("should convert subscript", async () => {
      const result = await executeTool(textileToMd, {
        input: "H~2~O",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Check subscript content is present
        expect((result.data as Record<string, unknown>).output).toContain("2");
      }
    });

    it("should convert inline code", async () => {
      const result = await executeTool(textileToMd, {
        input: "Use @code@ here",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "`code`"
        );
      }
    });

    it("should convert links", async () => {
      const result = await executeTool(textileToMd, {
        input: '"Click here":https://example.com',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Check link text is present
        expect((result.data as Record<string, unknown>).output).toContain(
          "Click here"
        );
      }
    });

    it("should convert images with alt text", async () => {
      const result = await executeTool(textileToMd, {
        input: "!image.png(Alt text)!",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Check image alt text is present
        expect((result.data as Record<string, unknown>).output).toContain(
          "Alt text"
        );
      }
    });

    it("should convert images without alt text", async () => {
      const result = await executeTool(textileToMd, {
        input: "!image.png!",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Check image is converted
        expect((result.data as Record<string, unknown>).output).toContain("!");
      }
    });

    it("should convert unordered lists", async () => {
      const result = await executeTool(textileToMd, {
        input: "* Item 1\n* Item 2\n* Item 3",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "- Item 1"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "- Item 2"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "- Item 3"
        );
      }
    });

    it("should convert nested unordered lists", async () => {
      const result = await executeTool(textileToMd, {
        input: "* Item 1\n** Nested\n*** Deep nested",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "- Item 1"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "  - Nested"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "    - Deep nested"
        );
      }
    });

    it("should convert ordered lists", async () => {
      const result = await executeTool(textileToMd, {
        input: "# First\n# Second\n# Third",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "1. First"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "1. Second"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "1. Third"
        );
      }
    });

    it("should convert blockquotes", async () => {
      const result = await executeTool(textileToMd, {
        input: "bq. This is a quote",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Check quote content is present
        expect((result.data as Record<string, unknown>).output).toContain(
          "This is a quote"
        );
      }
    });

    it("should convert horizontal rules", async () => {
      const result = await executeTool(textileToMd, {
        input: "Before\n---\nAfter",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "---"
        );
      }
    });

    it("should convert tables with headers", async () => {
      const result = await executeTool(textileToMd, {
        input: "|_. Header 1 |_. Header 2 |\n| Cell 1 | Cell 2 |",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "Header 1"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Header 2"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Cell 1"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Cell 2"
        );
      }
    });

    it("should convert footnotes", async () => {
      const result = await executeTool(textileToMd, {
        input: "Some text[1]\n\nfn1. Footnote text",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "[^1]"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "[^1]: Footnote text"
        );
      }
    });

    it("should remove paragraph markers", async () => {
      const result = await executeTool(textileToMd, {
        input: "p. This is a paragraph",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "This is a paragraph"
        );
      }
    });

    it("should handle empty input", async () => {
      const result = await executeTool(textileToMd, {
        input: "",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe("");
      }
    });

    it("should handle plain text without formatting", async () => {
      const result = await executeTool(textileToMd, {
        input: "Just plain text",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "Just plain text"
        );
      }
    });

    it("should clean up extra blank lines", async () => {
      const result = await executeTool(textileToMd, {
        input: "Line 1\n\n\n\n\nLine 2",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).not.toMatch(
          /\n{3,}/
        );
      }
    });

    it("should handle complex document", async () => {
      const textile = `h1. Document Title

h2. Introduction

This is *bold* and _italic_ text with @inline code@.

bq. A famous quote

* Item one
* Item two

"Visit website":https://example.com

!diagram.png(Architecture)!`;

      const result = await executeTool(textileToMd, { input: textile });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "Document Title"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Introduction"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "bold"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "italic"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "inline code"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "A famous quote"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Item one"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Visit website"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Architecture"
        );
      }
    });

    it("should remove acronym definitions", async () => {
      const result = await executeTool(textileToMd, {
        input: "HTML(HyperText Markup Language)",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe("HTML");
      }
    });
  });
});
