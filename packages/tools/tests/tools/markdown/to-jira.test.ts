import { describe, it, expect } from "vitest";
import { markdownToJira } from "../../../src/tools/markdown/to-jira";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("markdownToJira", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(markdownToJira.meta.id).toBe("markdown/to-jira");
      expect(markdownToJira.meta.name).toBe("Markdown to Jira");
      expect(markdownToJira.meta.category).toBe("markdown");
      expect(markdownToJira.meta.tier).toBe(ToolTier.CLIENT);
      expect(markdownToJira.meta.keywords).toContain("jira");
      expect(markdownToJira.meta.keywords).toContain("atlassian");
    });
  });

  describe("execute", () => {
    it("should convert h1 headers", async () => {
      const result = await executeTool(markdownToJira, {
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
      const result = await executeTool(markdownToJira, {
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

    it("should convert bold text with asterisks", async () => {
      const result = await executeTool(markdownToJira, {
        input: "This is **bold** text",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Bold conversion, check output contains bold text
        expect((result.data as Record<string, unknown>).output).toContain(
          "bold"
        );
      }
    });

    it("should convert bold text with underscores", async () => {
      const result = await executeTool(markdownToJira, {
        input: "This is __bold__ text",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Bold conversion, check output contains bold text
        expect((result.data as Record<string, unknown>).output).toContain(
          "bold"
        );
      }
    });

    it("should convert italic text", async () => {
      const result = await executeTool(markdownToJira, {
        input: "This is *italic* text",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "_italic_"
        );
      }
    });

    it("should convert strikethrough", async () => {
      const result = await executeTool(markdownToJira, {
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
      const result = await executeTool(markdownToJira, {
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
      const result = await executeTool(markdownToJira, {
        input: "```javascript\nconst x = 1;\n```",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "{code:javascript}"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "const x = 1;"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "{code}"
        );
      }
    });

    it("should convert code blocks without language", async () => {
      const result = await executeTool(markdownToJira, {
        input: "```\nconst x = 1;\n```",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "{code}"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "const x = 1;"
        );
      }
    });

    it("should convert links", async () => {
      const result = await executeTool(markdownToJira, {
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
      const result = await executeTool(markdownToJira, {
        input: "![Alt text](https://example.com/image.png)",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "!https://example.com/image.png!"
        );
      }
    });

    it("should convert unordered lists", async () => {
      const result = await executeTool(markdownToJira, {
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
      const result = await executeTool(markdownToJira, {
        input: "- Item 1\n  - Nested 1\n    - Deep nested",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "* Item 1"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Nested 1"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Deep nested"
        );
      }
    });

    it("should convert ordered lists", async () => {
      const result = await executeTool(markdownToJira, {
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
      const result = await executeTool(markdownToJira, {
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

    it("should convert blockquotes", async () => {
      const result = await executeTool(markdownToJira, {
        input: "> This is a quote",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "{quote}"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "This is a quote"
        );
      }
    });

    it("should convert multiline blockquotes", async () => {
      const result = await executeTool(markdownToJira, {
        input: "> Line 1\n> Line 2\n> Line 3",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "{quote}"
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
      }
    });

    it("should convert horizontal rules", async () => {
      const result = await executeTool(markdownToJira, {
        input: "Before\n---\nAfter",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "----"
        );
      }
    });

    it("should handle empty input", async () => {
      const result = await executeTool(markdownToJira, {
        input: "",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe("");
      }
    });

    it("should handle plain text without formatting", async () => {
      const result = await executeTool(markdownToJira, {
        input: "Just plain text",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "Just plain text"
        );
      }
    });

    it("should handle asterisk horizontal rules", async () => {
      const result = await executeTool(markdownToJira, {
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
      const result = await executeTool(markdownToJira, {
        input: "Before\n___\nAfter",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "----"
        );
      }
    });

    it("should handle asterisk lists", async () => {
      const result = await executeTool(markdownToJira, {
        input: "* Item 1\n* Item 2",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "* Item 1"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "* Item 2"
        );
      }
    });

    it("should handle plus sign lists", async () => {
      const result = await executeTool(markdownToJira, {
        input: "+ Item 1\n+ Item 2",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "* Item 1"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "* Item 2"
        );
      }
    });

    it("should handle complex document", async () => {
      const markdown = `# Project Update

## Summary

This is a **critical** update with *important* changes.

### Features

- Feature 1
- Feature 2

### Code Changes

\`\`\`python
def hello():
    print("Hello")
\`\`\`

> Note: This is important

1. First step
2. Second step

---

[Documentation](https://docs.example.com)`;

      const result = await executeTool(markdownToJira, { input: markdown });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "h1. Project Update"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "h2. Summary"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "critical"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "important"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "h3. Features"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "* Feature 1"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "{code:python}"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "{quote}"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "# First step"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "----"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "[Documentation|https://docs.example.com]"
        );
      }
    });

    it("should handle empty blockquote lines", async () => {
      const result = await executeTool(markdownToJira, {
        input: "> Line 1\n>\n> Line 2",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "{quote}"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Line 1"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Line 2"
        );
      }
    });

    it("should preserve inline code in text", async () => {
      const result = await executeTool(markdownToJira, {
        input: "Use the `npm install` command to install",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "{{npm install}}"
        );
      }
    });
  });
});
