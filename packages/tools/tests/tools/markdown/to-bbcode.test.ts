import { describe, it, expect } from "vitest";
import { markdownToBbcode } from "../../../src/tools/markdown/to-bbcode";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("markdownToBbcode", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(markdownToBbcode.meta.id).toBe("markdown/to-bbcode");
      expect(markdownToBbcode.meta.name).toBe("Markdown to BBCode");
      expect(markdownToBbcode.meta.category).toBe("markdown");
      expect(markdownToBbcode.meta.tier).toBe(ToolTier.CLIENT);
      expect(markdownToBbcode.meta.keywords).toContain("bbcode");
      expect(markdownToBbcode.meta.keywords).toContain("forum");
    });
  });

  describe("execute", () => {
    it("should convert bold text with asterisks", async () => {
      const result = await executeTool(markdownToBbcode, {
        input: "This is **bold** text",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "[b]bold[/b]"
        );
      }
    });

    it("should convert bold text with underscores", async () => {
      const result = await executeTool(markdownToBbcode, {
        input: "This is __bold__ text",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "[b]bold[/b]"
        );
      }
    });

    it("should convert italic text with asterisks", async () => {
      const result = await executeTool(markdownToBbcode, {
        input: "This is *italic* text",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "[i]italic[/i]"
        );
      }
    });

    it("should convert italic text with underscores", async () => {
      const result = await executeTool(markdownToBbcode, {
        input: "This is _italic_ text",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "[i]italic[/i]"
        );
      }
    });

    it("should convert strikethrough", async () => {
      const result = await executeTool(markdownToBbcode, {
        input: "This is ~~deleted~~ text",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "[s]deleted[/s]"
        );
      }
    });

    it("should convert inline code", async () => {
      const result = await executeTool(markdownToBbcode, {
        input: "Use `code` here",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "[code]code[/code]"
        );
      }
    });

    it("should convert fenced code blocks", async () => {
      const result = await executeTool(markdownToBbcode, {
        input: "```\nconst x = 1;\n```",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "[code]"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "const x = 1;"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "[/code]"
        );
      }
    });

    it("should convert fenced code blocks with language", async () => {
      const result = await executeTool(markdownToBbcode, {
        input: "```javascript\nconst x = 1;\n```",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "[code]"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "const x = 1;"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "[/code]"
        );
      }
    });

    it("should convert images", async () => {
      const result = await executeTool(markdownToBbcode, {
        input: "![alt text](https://example.com/image.png)",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "[img]https://example.com/image.png[/img]"
        );
      }
    });

    it("should convert links", async () => {
      const result = await executeTool(markdownToBbcode, {
        input: "[Click here](https://example.com)",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "[url=https://example.com]Click here[/url]"
        );
      }
    });

    it("should convert h1 headers", async () => {
      const result = await executeTool(markdownToBbcode, {
        input: "# Header 1",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "[size=7][b]Header 1[/b][/size]"
        );
      }
    });

    it("should convert h2 headers", async () => {
      const result = await executeTool(markdownToBbcode, {
        input: "## Header 2",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "[size=6][b]Header 2[/b][/size]"
        );
      }
    });

    it("should convert all header levels", async () => {
      const result = await executeTool(markdownToBbcode, {
        input: "### H3\n#### H4\n##### H5\n###### H6",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "[size=5][b]H3[/b][/size]"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "[size=4][b]H4[/b][/size]"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "[size=3][b]H5[/b][/size]"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "[size=2][b]H6[/b][/size]"
        );
      }
    });

    it("should convert blockquotes", async () => {
      const result = await executeTool(markdownToBbcode, {
        input: "> This is a quote",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "[quote]This is a quote[/quote]"
        );
      }
    });

    it("should convert multiline blockquotes", async () => {
      const result = await executeTool(markdownToBbcode, {
        input: "> Line 1\n> Line 2\n> Line 3",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "[quote]"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Line 1"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Line 2"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Line 3"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "[/quote]"
        );
      }
    });

    it("should convert unordered lists", async () => {
      const result = await executeTool(markdownToBbcode, {
        input: "- Item 1\n- Item 2\n- Item 3",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "[list]"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "[*]Item 1"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "[*]Item 2"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "[*]Item 3"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "[/list]"
        );
      }
    });

    it("should convert ordered lists", async () => {
      const result = await executeTool(markdownToBbcode, {
        input: "1. First\n2. Second\n3. Third",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "[list=1]"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "[*]First"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "[*]Second"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "[*]Third"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "[/list]"
        );
      }
    });

    it("should convert horizontal rules", async () => {
      const result = await executeTool(markdownToBbcode, {
        input: "Before\n---\nAfter",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "[hr]"
        );
      }
    });

    it("should use custom header sizes", async () => {
      const result = await executeTool(
        markdownToBbcode,
        { input: "# H1\n## H2" },
        { headerSizes: { h1: 5, h2: 4, h3: 3, h4: 2, h5: 1, h6: 1 } }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "[size=5][b]H1[/b][/size]"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "[size=4][b]H2[/b][/size]"
        );
      }
    });

    it("should handle empty input", async () => {
      const result = await executeTool(markdownToBbcode, {
        input: "",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe("");
      }
    });

    it("should handle plain text without formatting", async () => {
      const result = await executeTool(markdownToBbcode, {
        input: "Just plain text",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "Just plain text"
        );
      }
    });

    it("should handle mixed list types", async () => {
      const result = await executeTool(markdownToBbcode, {
        input: "- Unordered\n\n1. Ordered",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "[list]"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "[list=1]"
        );
      }
    });

    it("should handle complex document", async () => {
      const markdown = `# Title

This is **bold** and *italic* text.

## Code Section

\`\`\`
const x = 1;
\`\`\`

> A quote

- Item 1
- Item 2

[Link](https://example.com)`;

      const result = await executeTool(markdownToBbcode, { input: markdown });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "[size=7][b]Title[/b][/size]"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "[b]bold[/b]"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "[i]italic[/i]"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "[code]"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "[quote]"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "[list]"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "[url=https://example.com]Link[/url]"
        );
      }
    });

    it("should handle asterisk horizontal rules", async () => {
      const result = await executeTool(markdownToBbcode, {
        input: "Before\n***\nAfter",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "[hr]"
        );
      }
    });

    it("should handle underscore horizontal rules", async () => {
      const result = await executeTool(markdownToBbcode, {
        input: "Before\n___\nAfter",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "[hr]"
        );
      }
    });

    it("should handle plus sign lists", async () => {
      const result = await executeTool(markdownToBbcode, {
        input: "+ Item 1\n+ Item 2",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "[list]"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "[*]Item 1"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "[*]Item 2"
        );
      }
    });

    it("should handle asterisk lists", async () => {
      const result = await executeTool(markdownToBbcode, {
        input: "* Item 1\n* Item 2",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "[list]"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "[*]Item 1"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "[*]Item 2"
        );
      }
    });
  });
});
