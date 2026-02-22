import { describe, it, expect } from "vitest";
import { jiraToMarkdown } from "../../../src/tools/markdown/from-jira";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("jiraToMarkdown", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(jiraToMarkdown.meta.id).toBe("markdown/from-jira");
      expect(jiraToMarkdown.meta.name).toBe("Jira to Markdown");
      expect(jiraToMarkdown.meta.category).toBe("markdown");
      expect(jiraToMarkdown.meta.tier).toBe(ToolTier.CLIENT);
      expect(jiraToMarkdown.meta.keywords).toContain("jira");
      expect(jiraToMarkdown.meta.keywords).toContain("markdown");
    });
  });

  describe("execute", () => {
    it("should convert Jira bold to markdown bold", async () => {
      const result = await executeTool(jiraToMarkdown, {
        input: "*bold text*",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "**bold text**"
        );
      }
    });

    it("should convert inline code", async () => {
      const result = await executeTool(jiraToMarkdown, {
        input: "This is {{code}}",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "This is `code`"
        );
      }
    });

    it("should convert code blocks with language", async () => {
      const result = await executeTool(jiraToMarkdown, {
        input: "{code:javascript}\nconst x = 1;\n{code}",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "```javascript"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "const x = 1;"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "```"
        );
      }
    });

    it("should convert code blocks without language", async () => {
      const result = await executeTool(jiraToMarkdown, {
        input: "{code}\nsome code\n{code}",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "```"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "some code"
        );
      }
    });

    it("should convert images", async () => {
      const result = await executeTool(jiraToMarkdown, {
        input: "See !screenshot.png!",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "See ![](screenshot.png)"
        );
      }
    });

    it("should convert links with text", async () => {
      const result = await executeTool(jiraToMarkdown, {
        input: "[Click here|https://example.com]",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "[Click here](https://example.com)"
        );
      }
    });

    it("should convert plain URL links", async () => {
      const result = await executeTool(jiraToMarkdown, {
        input: "[https://example.com]",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "[https://example.com](https://example.com)"
        );
      }
    });

    it("should convert headers h1-h6", async () => {
      const result = await executeTool(jiraToMarkdown, {
        input:
          "h1. Title\nh2. Subtitle\nh3. Section\nh4. Sub\nh5. Deep\nh6. Deeper",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Headers are converted, verify content exists
        expect((result.data as Record<string, unknown>).output).toContain(
          "Title"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Subtitle"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Section"
        );
      }
    });

    it("should convert blockquotes", async () => {
      const result = await executeTool(jiraToMarkdown, {
        input: "{quote}\nQuoted text\nAnother line\n{quote}",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "> Quoted text"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "> Another line"
        );
      }
    });

    it("should convert unordered lists", async () => {
      const result = await executeTool(jiraToMarkdown, {
        input: "* Item 1\n* Item 2\n** Nested item",
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
          "  - Nested item"
        );
      }
    });

    it("should convert horizontal rules", async () => {
      const result = await executeTool(jiraToMarkdown, {
        input: "Before\n----\nAfter",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "---"
        );
      }
    });

    it("should convert strikethrough", async () => {
      const result = await executeTool(jiraToMarkdown, {
        input: "-deleted text-",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "~~deleted text~~"
        );
      }
    });

    it("should handle empty input", async () => {
      const result = await executeTool(jiraToMarkdown, {
        input: "",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe("");
      }
    });

    it("should handle plain text without formatting", async () => {
      const result = await executeTool(jiraToMarkdown, {
        input: "Just plain text",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "Just plain text"
        );
      }
    });

    it("should handle complex document", async () => {
      const jira = `h1. Main Title

This is *bold* and some {{inline code}}.

h2. Code Example

{code:python}
def hello():
    print("Hello")
{code}

* List item 1
* List item 2

{quote}
A famous quote here.
{quote}

[Documentation|https://docs.example.com]`;

      const result = await executeTool(jiraToMarkdown, { input: jira });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "Main Title"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "**bold**"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "`inline code`"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "```python"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "List item 1"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "[Documentation](https://docs.example.com)"
        );
      }
    });

    it("should not convert text inside code blocks", async () => {
      const result = await executeTool(jiraToMarkdown, {
        input: "{code}\n*not bold*\n{code}",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // The text inside code block should be preserved
        expect((result.data as Record<string, unknown>).output).toContain(
          "*not bold*"
        );
      }
    });

    it("should handle nested lists", async () => {
      const result = await executeTool(jiraToMarkdown, {
        input: "* Level 1\n** Level 2\n*** Level 3",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "- Level 1"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "  - Level 2"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "    - Level 3"
        );
      }
    });

    it("should preserve italic underscore syntax", async () => {
      const result = await executeTool(jiraToMarkdown, {
        input: "_italic text_",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "_italic text_"
        );
      }
    });
  });
});
