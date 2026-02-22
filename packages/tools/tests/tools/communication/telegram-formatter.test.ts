import { describe, it, expect } from "vitest";
import { telegramFormatter } from "../../../src/tools/communication/telegram-formatter";

describe("telegram-formatter", () => {
  const execute = (input: string, options?: Record<string, unknown>): string =>
    (
      telegramFormatter.execute({ input }, options as never) as {
        output: string;
      }
    ).output;

  describe("HTML mode (default)", () => {
    it("converts **bold** to <b>", () => {
      expect(execute("**bold**")).toBe("<b>bold</b>");
    });

    it("converts *italic* to <i>", () => {
      expect(execute("*italic*")).toBe("<i>italic</i>");
    });

    it("converts _italic_ to <i>", () => {
      expect(execute("_italic_")).toBe("<i>italic</i>");
    });

    it("converts __underline__ to <u>", () => {
      expect(execute("__underline__")).toBe("<u>underline</u>");
    });

    it("converts ~~strikethrough~~ to <s>", () => {
      expect(execute("~~deleted~~")).toBe("<s>deleted</s>");
    });

    it("converts `code` to <code>", () => {
      expect(execute("`code`")).toBe("<code>code</code>");
    });

    it("converts code blocks to <pre>", () => {
      expect(execute("```\nconsole.log('hi')\n```")).toContain(
        "<pre>console.log('hi')\n</pre>"
      );
    });

    it("converts [text](url) to <a>", () => {
      expect(execute("[click](https://example.com)")).toBe(
        '<a href="https://example.com">click</a>'
      );
    });

    it("converts blockquotes", () => {
      expect(execute("> quoted text")).toBe(
        "<blockquote>quoted text</blockquote>"
      );
    });
  });

  describe("MarkdownV2 mode", () => {
    const opts = { mode: "markdown" };

    it("escapes special characters", () => {
      const output = execute("Hello! How are you?", opts);
      expect(output).toContain("\\!");
    });

    it("preserves bold formatting", () => {
      const output = execute("**bold text**", opts);
      expect(output).toBe("*bold text*");
    });

    it("preserves italic formatting", () => {
      const output = execute("_italic text_", opts);
      expect(output).toBe("_italic text_");
    });

    it("preserves strikethrough formatting", () => {
      const output = execute("~~deleted~~", opts);
      expect(output).toBe("~deleted~");
    });

    it("preserves inline code", () => {
      const output = execute("`code`", opts);
      expect(output).toBe("`code`");
    });

    it("preserves link formatting with escaped URL", () => {
      const output = execute("[text](https://example.com)", opts);
      expect(output).toBe("[text](https://example\\.com)");
    });

    it("escapes dots and hyphens in plain text", () => {
      const output = execute("v2.0 - release", opts);
      expect(output).toContain("\\.");
      expect(output).toContain("\\-");
    });
  });

  it("throws on empty input", () => {
    expect(() => telegramFormatter.execute({ input: "" })).toThrow(
      "Input cannot be empty"
    );
  });

  it("throws on whitespace-only input", () => {
    expect(() => telegramFormatter.execute({ input: "   " })).toThrow(
      "Input cannot be empty"
    );
  });
});
