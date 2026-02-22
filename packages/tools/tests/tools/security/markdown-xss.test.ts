import { describe, it, expect } from "vitest";
import { markdownToHtml } from "../../../src/tools/markdown/to-html";
import { executeTool } from "../../../src/core/executor";

describe("Markdown to HTML - XSS sanitization", () => {
  const xssPayloads = [
    {
      name: "script tag",
      input: '<script>alert("xss")</script>',
      mustNotContain: ["<script>", "alert("],
    },
    {
      name: "img onerror",
      input: "<img src=x onerror=alert(1)>",
      mustNotContain: ["onerror"],
    },
    {
      name: "svg onload",
      input: "<svg onload=alert(1)>",
      mustNotContain: ["onload"],
    },
    {
      name: "javascript: URL",
      input: '<a href="javascript:alert(1)">click</a>',
      mustNotContain: ["javascript:"],
    },
    {
      name: "data URI with script",
      input: '<a href="data:text/html,<script>alert(1)</script>">click</a>',
      mustNotContain: ["data:text/html"],
    },
    {
      name: "event handler with single quotes",
      input: "<div onclick='alert(1)'>test</div>",
      mustNotContain: ["onclick"],
    },
    {
      name: "event handler unquoted",
      input: "<div onmouseover=alert(1)>test</div>",
      mustNotContain: ["onmouseover"],
    },
    {
      name: "iframe injection",
      input: '<iframe src="javascript:alert(1)"></iframe>',
      mustNotContain: ["<iframe"],
    },
    {
      name: "body onload",
      input: '<body onload="alert(1)">',
      mustNotContain: ["onload"],
    },
  ];

  describe("markdownToHtml - sanitize defaults to true", () => {
    it("should default sanitize option to true", async () => {
      // When no sanitize option is given, output should be sanitized
      const result = await executeTool(markdownToHtml, {
        input: '<script>alert("xss")</script>',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const html = (result.data as Record<string, unknown>).html as string;
        expect(html).not.toContain("<script>");
      }
    });

    for (const payload of xssPayloads) {
      it(`should sanitize ${payload.name}`, async () => {
        const result = await executeTool(
          markdownToHtml,
          { input: payload.input },
          { sanitize: true }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          const html = (result.data as Record<string, unknown>).html as string;
          for (const forbidden of payload.mustNotContain) {
            expect(html.toLowerCase()).not.toContain(forbidden.toLowerCase());
          }
        }
      });
    }
  });

  describe("markdownToHtml - no global state mutation", () => {
    it("should not mutate global marked options between calls", async () => {
      // First call with breaks: true
      await executeTool(
        markdownToHtml,
        { input: "Line 1\nLine 2" },
        { breaks: true }
      );

      // Second call with default (breaks: false)
      const result = await executeTool(markdownToHtml, {
        input: "Line 1\nLine 2",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Should NOT contain <br> because breaks defaults to false
        const html = (result.data as Record<string, unknown>).html as string;
        expect(html).not.toContain("<br");
      }
    });
  });
});
