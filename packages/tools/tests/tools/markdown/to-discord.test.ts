import { describe, it, expect } from "vitest";
import { markdownToDiscord } from "../../../src/tools/markdown/to-discord";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("markdownToDiscord", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(markdownToDiscord.meta.id).toBe("markdown/to-discord");
      expect(markdownToDiscord.meta.name).toBe("Markdown to Discord");
      expect(markdownToDiscord.meta.category).toBe("markdown");
      expect(markdownToDiscord.meta.tier).toBe(ToolTier.CLIENT);
      expect(markdownToDiscord.meta.keywords).toContain("discord");
      expect(markdownToDiscord.meta.keywords).toContain("timestamp");
    });
  });

  describe("execute", () => {
    it("should convert headers to bold", async () => {
      const result = await executeTool(markdownToDiscord, {
        input: "# Title",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "**Title**"
        );
      }
    });

    it("should convert all header levels to bold", async () => {
      const result = await executeTool(markdownToDiscord, {
        input: "## H2\n### H3\n#### H4\n##### H5\n###### H6",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "**H2**"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "**H3**"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "**H4**"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "**H5**"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "**H6**"
        );
      }
    });

    it("should preserve bold text", async () => {
      const result = await executeTool(markdownToDiscord, {
        input: "This is **bold** text",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "**bold**"
        );
      }
    });

    it("should preserve italic text", async () => {
      const result = await executeTool(markdownToDiscord, {
        input: "This is *italic* text",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "*italic*"
        );
      }
    });

    it("should preserve strikethrough", async () => {
      const result = await executeTool(markdownToDiscord, {
        input: "This is ~~deleted~~ text",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "~~deleted~~"
        );
      }
    });

    it("should preserve inline code", async () => {
      const result = await executeTool(markdownToDiscord, {
        input: "Use `code` here",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "`code`"
        );
      }
    });

    it("should preserve code blocks", async () => {
      const result = await executeTool(markdownToDiscord, {
        input: "```javascript\nconst x = 1;\n```",
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

    it("should convert images to URLs", async () => {
      const result = await executeTool(markdownToDiscord, {
        input: "![Alt text](https://example.com/image.png)",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "https://example.com/image.png"
        );
      }
    });

    it("should preserve links", async () => {
      const result = await executeTool(markdownToDiscord, {
        input: "[Click here](https://example.com)",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "[Click here](https://example.com)"
        );
      }
    });

    it("should preserve blockquotes", async () => {
      const result = await executeTool(markdownToDiscord, {
        input: "> This is a quote",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "> This is a quote"
        );
      }
    });

    it("should preserve list items", async () => {
      const result = await executeTool(markdownToDiscord, {
        input: "- Item 1\n- Item 2",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "- Item 1"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "- Item 2"
        );
      }
    });

    it("should convert horizontal rules", async () => {
      const result = await executeTool(markdownToDiscord, {
        input: "Before\n---\nAfter",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "---"
        );
      }
    });

    it("should convert ISO timestamps to Discord format", async () => {
      const result = await executeTool(markdownToDiscord, {
        input: "Meeting at 2024-01-15T14:30:00Z",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toMatch(
          /<t:\d+:f>/
        );
      }
    });

    it("should convert date-only timestamps", async () => {
      const result = await executeTool(markdownToDiscord, {
        input: "Due date: 2024-01-15",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toMatch(
          /<t:\d+:f>/
        );
      }
    });

    it("should use custom timestamp style", async () => {
      const result = await executeTool(
        markdownToDiscord,
        { input: "Date: 2024-01-15" },
        { timestampStyle: "R" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toMatch(
          /<t:\d+:R>/
        );
      }
    });

    it("should disable timestamp conversion", async () => {
      const result = await executeTool(
        markdownToDiscord,
        { input: "Date: 2024-01-15" },
        { convertTimestamps: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "2024-01-15"
        );
        expect((result.data as Record<string, unknown>).output).not.toMatch(
          /<t:\d+/
        );
      }
    });

    it("should preserve @mentions", async () => {
      const result = await executeTool(markdownToDiscord, {
        input: "Hello @user123!",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "@user123"
        );
      }
    });

    it("should handle convertMentions option", async () => {
      const result = await executeTool(
        markdownToDiscord,
        { input: "Hello @user!" },
        { convertMentions: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "@user"
        );
      }
    });

    it("should handle empty input", async () => {
      const result = await executeTool(markdownToDiscord, {
        input: "",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe("");
      }
    });

    it("should handle plain text without formatting", async () => {
      const result = await executeTool(markdownToDiscord, {
        input: "Just plain text",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "Just plain text"
        );
      }
    });

    it("should not convert timestamps inside code blocks", async () => {
      const result = await executeTool(markdownToDiscord, {
        input: "```\n2024-01-15\n```",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "2024-01-15"
        );
        expect((result.data as Record<string, unknown>).output).not.toMatch(
          /<t:\d+/
        );
      }
    });

    it("should not convert timestamps inside inline code", async () => {
      const result = await executeTool(markdownToDiscord, {
        input: "Use `2024-01-15` format",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "`2024-01-15`"
        );
        expect((result.data as Record<string, unknown>).output).not.toMatch(
          /<t:\d+/
        );
      }
    });

    it("should handle complex document", async () => {
      const markdown = `# Announcement

**Important update!**

Meeting scheduled for 2024-06-15T10:00:00Z

## Agenda

- Item 1
- Item 2

> Remember to prepare!

\`\`\`
code block
\`\`\`

Contact @admin for more info.`;

      const result = await executeTool(markdownToDiscord, { input: markdown });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "**Announcement**"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "**Important update!**"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "**Agenda**"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "- Item 1"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "> Remember to prepare!"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "```"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "@admin"
        );
        expect((result.data as Record<string, unknown>).output).toMatch(
          /<t:\d+:f>/
        );
      }
    });

    it("should handle timestamp with timezone offset", async () => {
      const result = await executeTool(markdownToDiscord, {
        input: "Event: 2024-01-15T14:30:00+05:30",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toMatch(
          /<t:\d+:f>/
        );
      }
    });

    it("should handle timestamp with milliseconds", async () => {
      const result = await executeTool(markdownToDiscord, {
        input: "Time: 2024-01-15T14:30:00.000Z",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toMatch(
          /<t:\d+:f>/
        );
      }
    });

    it("should use short time timestamp style", async () => {
      const result = await executeTool(
        markdownToDiscord,
        { input: "Time: 2024-01-15" },
        { timestampStyle: "t" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toMatch(
          /<t:\d+:t>/
        );
      }
    });

    it("should use long time timestamp style", async () => {
      const result = await executeTool(
        markdownToDiscord,
        { input: "Time: 2024-01-15" },
        { timestampStyle: "T" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toMatch(
          /<t:\d+:T>/
        );
      }
    });

    it("should use short date timestamp style", async () => {
      const result = await executeTool(
        markdownToDiscord,
        { input: "Date: 2024-01-15" },
        { timestampStyle: "d" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toMatch(
          /<t:\d+:d>/
        );
      }
    });

    it("should use long date timestamp style", async () => {
      const result = await executeTool(
        markdownToDiscord,
        { input: "Date: 2024-01-15" },
        { timestampStyle: "D" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toMatch(
          /<t:\d+:D>/
        );
      }
    });

    it("should use long datetime timestamp style", async () => {
      const result = await executeTool(
        markdownToDiscord,
        { input: "DateTime: 2024-01-15" },
        { timestampStyle: "F" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toMatch(
          /<t:\d+:F>/
        );
      }
    });
  });
});
