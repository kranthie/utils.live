import { describe, it, expect } from "vitest";
import { markdownToConfluence } from "../../../src/tools/markdown/to-confluence";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("markdownToConfluence", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(markdownToConfluence.meta.id).toBe("markdown/to-confluence");
      expect(markdownToConfluence.meta.name).toBe("Markdown to Confluence");
      expect(markdownToConfluence.meta.category).toBe("markdown");
      expect(markdownToConfluence.meta.tier).toBe(ToolTier.CLIENT);
      expect(markdownToConfluence.meta.keywords).toContain("confluence");
      expect(markdownToConfluence.meta.keywords).toContain("atlassian");
    });
  });

  describe("execute", () => {
    it("should convert h1 headers", async () => {
      const result = await executeTool(markdownToConfluence, {
        input: "# Heading 1",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "h1. Heading 1"
        );
      }
    });

    it("should convert all header levels", async () => {
      const result = await executeTool(markdownToConfluence, {
        input: "## H2\n### H3\n#### H4\n##### H5\n###### H6",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "h2. H2"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "h3. H3"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "h4. H4"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "h5. H5"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "h6. H6"
        );
      }
    });

    it("should convert bold text", async () => {
      const result = await executeTool(markdownToConfluence, {
        input: "This is **bold** text",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Bold conversion - check bold word is present
        expect((result.data as Record<string, unknown>).output).toContain(
          "bold"
        );
      }
    });

    it("should convert italic text", async () => {
      const result = await executeTool(markdownToConfluence, {
        input: "This is *italic* text",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "_italic_"
        );
      }
    });

    it("should convert bold italic text", async () => {
      const result = await executeTool(markdownToConfluence, {
        input: "This is ***bold italic*** text",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Check bold italic text is present in output
        expect((result.data as Record<string, unknown>).output).toContain(
          "bold italic"
        );
      }
    });

    it("should convert strikethrough", async () => {
      const result = await executeTool(markdownToConfluence, {
        input: "This is ~~deleted~~ text",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "-deleted-"
        );
      }
    });

    it("should convert inline code", async () => {
      const result = await executeTool(markdownToConfluence, {
        input: "Use `code` here",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "{{code}}"
        );
      }
    });

    it("should convert code blocks with language", async () => {
      const result = await executeTool(markdownToConfluence, {
        input: "```javascript\nconst x = 1;\n```",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Check code content is present
        expect((result.data as Record<string, unknown>).output).toContain(
          "javascript"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "const x = 1;"
        );
      }
    });

    it("should convert code blocks without language", async () => {
      const result = await executeTool(markdownToConfluence, {
        input: "```\nconst x = 1;\n```",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Check code content is present
        expect((result.data as Record<string, unknown>).output).toContain(
          "const x = 1;"
        );
      }
    });

    it("should convert blockquotes", async () => {
      const result = await executeTool(markdownToConfluence, {
        input: "> This is a quote",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "{quote}"
        );
      }
    });

    it("should convert links", async () => {
      const result = await executeTool(markdownToConfluence, {
        input: "[Click here](https://example.com)",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "[Click here|https://example.com]"
        );
      }
    });

    it("should convert images", async () => {
      const result = await executeTool(markdownToConfluence, {
        input: "![Alt text](https://example.com/image.png)",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Check image URL is present
        expect((result.data as Record<string, unknown>).output).toContain(
          "https://example.com/image.png"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Alt text"
        );
      }
    });

    it("should convert unordered lists", async () => {
      const result = await executeTool(markdownToConfluence, {
        input: "- Item 1\n- Item 2\n- Item 3",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "* Item 1"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "* Item 2"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "* Item 3"
        );
      }
    });

    it("should convert nested unordered lists", async () => {
      const result = await executeTool(markdownToConfluence, {
        input: "- Item 1\n  - Nested 1\n    - Deep nested",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "* Item 1"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "** Nested 1"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "*** Deep nested"
        );
      }
    });

    it("should convert ordered lists", async () => {
      const result = await executeTool(markdownToConfluence, {
        input: "1. First\n2. Second\n3. Third",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "# First"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "# Second"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "# Third"
        );
      }
    });

    it("should convert nested ordered lists", async () => {
      const result = await executeTool(markdownToConfluence, {
        input: "1. First\n  1. Nested\n    1. Deep",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "# First"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "## Nested"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "### Deep"
        );
      }
    });

    it("should convert horizontal rules", async () => {
      const result = await executeTool(markdownToConfluence, {
        input: "Before\n---\nAfter",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "----"
        );
      }
    });

    it("should convert task lists (checked)", async () => {
      const result = await executeTool(markdownToConfluence, {
        input: "- [x] Completed task",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Check task text is present
        expect((result.data as Record<string, unknown>).output).toContain(
          "Completed task"
        );
      }
    });

    it("should convert task lists (unchecked)", async () => {
      const result = await executeTool(markdownToConfluence, {
        input: "- [ ] Pending task",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Check task text is present
        expect((result.data as Record<string, unknown>).output).toContain(
          "Pending task"
        );
      }
    });

    it("should handle empty input", async () => {
      const result = await executeTool(markdownToConfluence, {
        input: "",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe("");
      }
    });

    it("should handle plain text without formatting", async () => {
      const result = await executeTool(markdownToConfluence, {
        input: "Just plain text",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "Just plain text"
        );
      }
    });

    it("should convert tables", async () => {
      const result = await executeTool(markdownToConfluence, {
        input:
          "| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1 | Cell 2 |",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain("||");
        expect((result.data as Record<string, unknown>).output).toContain(
          "Header 1"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Cell 1"
        );
      }
    });

    it("should handle complex document", async () => {
      const markdown = `# Project Documentation

## Overview

This is a **bold** statement with *italic* emphasis.

### Features

- Feature 1
- Feature 2

### Code Example

\`\`\`python
def hello():
    print("Hello World")
\`\`\`

> Important note

[Learn more](https://docs.example.com)

---

## Tasks

Done task
Todo task`;

      const result = await executeTool(markdownToConfluence, {
        input: markdown,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "h1. Project Documentation"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "h2. Overview"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "bold"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "italic"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "* Feature 1"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "python"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "{quote}"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "[Learn more|https://docs.example.com]"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "----"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Done task"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Todo task"
        );
      }
    });

    it("should handle underscore bold", async () => {
      const result = await executeTool(markdownToConfluence, {
        input: "This is __bold__ text",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "*bold*"
        );
      }
    });

    it("should handle underscore italic", async () => {
      const result = await executeTool(markdownToConfluence, {
        input: "This is _italic_ text",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "_italic_"
        );
      }
    });

    it("should handle asterisk horizontal rules", async () => {
      const result = await executeTool(markdownToConfluence, {
        input: "Before\n***\nAfter",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "----"
        );
      }
    });

    it("should handle underscore horizontal rules", async () => {
      const result = await executeTool(markdownToConfluence, {
        input: "Before\n___\nAfter",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "----"
        );
      }
    });
  });
});
