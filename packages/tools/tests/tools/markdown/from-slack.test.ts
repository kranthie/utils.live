import { describe, it, expect } from "vitest";
import { slackToMarkdown } from "../../../src/tools/markdown/from-slack";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("slackToMarkdown", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(slackToMarkdown.meta.id).toBe("markdown/from-slack");
      expect(slackToMarkdown.meta.name).toBe("Slack to Markdown");
      expect(slackToMarkdown.meta.category).toBe("markdown");
      expect(slackToMarkdown.meta.tier).toBe(ToolTier.CLIENT);
      expect(slackToMarkdown.meta.keywords).toContain("slack");
      expect(slackToMarkdown.meta.keywords).toContain("mrkdwn");
    });
  });

  describe("execute", () => {
    it("should convert Slack bold to markdown bold", async () => {
      const result = await executeTool(slackToMarkdown, {
        input: "*bold text*",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "**bold text**"
        );
      }
    });

    it("should preserve italic underscore syntax", async () => {
      const result = await executeTool(slackToMarkdown, {
        input: "_italic text_",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "_italic text_"
        );
      }
    });

    it("should preserve inline code", async () => {
      const result = await executeTool(slackToMarkdown, {
        input: "This is `code`",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "This is `code`"
        );
      }
    });

    it("should preserve code blocks", async () => {
      const result = await executeTool(slackToMarkdown, {
        input: "```\ncode block\n```",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "```"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "code block"
        );
      }
    });

    it("should convert links with text", async () => {
      const result = await executeTool(slackToMarkdown, {
        input: "<https://example.com|Click here>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "[Click here](https://example.com)"
        );
      }
    });

    it("should convert plain links", async () => {
      const result = await executeTool(slackToMarkdown, {
        input: "<https://example.com>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "[https://example.com](https://example.com)"
        );
      }
    });

    it("should convert strikethrough", async () => {
      const result = await executeTool(slackToMarkdown, {
        input: "~deleted text~",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "~~deleted text~~"
        );
      }
    });

    it("should convert user mentions", async () => {
      const result = await executeTool(slackToMarkdown, {
        input: "Hello <@U12345678>!",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "Hello @U12345678!"
        );
      }
    });

    it("should convert channel mentions with name", async () => {
      const result = await executeTool(slackToMarkdown, {
        input: "Join <#C12345678|general>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "Join #general"
        );
      }
    });

    it("should convert channel mentions without name", async () => {
      const result = await executeTool(slackToMarkdown, {
        input: "Join <#C12345678>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "Join #C12345678"
        );
      }
    });

    it("should preserve blockquotes", async () => {
      const result = await executeTool(slackToMarkdown, {
        input: "> Quote text",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "> Quote text"
        );
      }
    });

    it("should handle empty input", async () => {
      const result = await executeTool(slackToMarkdown, {
        input: "",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe("");
      }
    });

    it("should handle plain text", async () => {
      const result = await executeTool(slackToMarkdown, {
        input: "Just plain text",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "Just plain text"
        );
      }
    });

    it("should not convert formatting inside code blocks", async () => {
      const result = await executeTool(slackToMarkdown, {
        input: "```\n*not bold*\n```",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Should preserve * inside code block
        expect((result.data as Record<string, unknown>).output).toContain(
          "*not bold*"
        );
      }
    });

    it("should not convert formatting inside inline code", async () => {
      const result = await executeTool(slackToMarkdown, {
        input: "`*not bold*`",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "`*not bold*`"
        );
      }
    });

    it("should handle complex message", async () => {
      const slack = `*Important Update*

Hello <@U12345678>!

Please check <https://docs.example.com|the documentation> and join <#C12345678|dev-team>.

_Note:_ This is ~outdated~ updated info.

\`\`\`
code example
\`\`\``;

      const result = await executeTool(slackToMarkdown, { input: slack });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "**Important Update**"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "@U12345678"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "[the documentation](https://docs.example.com)"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "#dev-team"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "~~outdated~~"
        );
      }
    });

    it("should handle multiple user mentions", async () => {
      const result = await executeTool(slackToMarkdown, {
        input: "cc <@U11111111> <@U22222222>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "cc @U11111111 @U22222222"
        );
      }
    });

    it("should handle mixed formatting", async () => {
      const result = await executeTool(slackToMarkdown, {
        input: "*bold* and _italic_ and ~strike~",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "**bold** and _italic_ and ~~strike~~"
        );
      }
    });

    it("should handle list items", async () => {
      const result = await executeTool(slackToMarkdown, {
        input: "- Item 1\n- Item 2\n- Item 3",
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
  });
});
