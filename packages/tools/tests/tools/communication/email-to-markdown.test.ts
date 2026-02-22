import { describe, it, expect } from "vitest";
import { emailToMarkdown } from "../../../src/tools/communication/email-to-markdown";

describe("email-to-markdown", () => {
  const execute = (input: string): string =>
    (emailToMarkdown.execute({ input }) as { output: string }).output;

  it("converts subject to h1 heading", () => {
    const md = execute("Subject: Meeting Notes\n\nHello");
    expect(md).toContain("# Meeting Notes");
  });

  it("converts headers to markdown table", () => {
    const md = execute("From: alice@example.com\nTo: bob@example.com\n\nBody");
    expect(md).toContain("| **From** | alice@example.com |");
    expect(md).toContain("| **To** | bob@example.com |");
    expect(md).toContain("| Field | Value |");
    expect(md).toContain("|-------|-------|");
  });

  it("includes horizontal rule after headers", () => {
    const md = execute("From: user@example.com\n\nBody text");
    expect(md).toContain("---");
  });

  it("converts URLs to markdown links", () => {
    const md = execute("From: a@example.com\n\nVisit https://example.com/page");
    expect(md).toContain(
      "[https://example.com/page](https://example.com/page)"
    );
  });

  it("converts email addresses to mailto links", () => {
    const md = execute(
      "From: a@example.com\n\nContact support@example.com for help"
    );
    expect(md).toContain("[support@example.com](mailto:support@example.com)");
  });

  it("converts indented text to blockquotes", () => {
    const md = execute("From: a@example.com\n\n    This is a quoted line");
    expect(md).toContain("> This is a quoted line");
  });

  it("preserves existing blockquotes", () => {
    const md = execute("From: a@example.com\n\n> Already quoted");
    expect(md).toContain("> Already quoted");
  });

  it("returns input as-is when no headers found", () => {
    const md = execute("Just some plain text\nwith no headers");
    expect(md).toBe("Just some plain text\nwith no headers");
  });

  it("includes body text after separator", () => {
    const md = execute("From: a@example.com\nSubject: Test\n\nHello world");
    expect(md).toContain("Hello world");
  });

  it("omits subject from table (already in heading)", () => {
    const md = execute("From: a@example.com\nSubject: Test\n\nBody");
    const tableLines = md
      .split("\n")
      .filter((l: string) => l.startsWith("|") && l.includes("**"));
    const subjectRow = tableLines.find((l: string) =>
      l.includes("**Subject**")
    );
    expect(subjectRow).toBeUndefined();
  });

  it("throws on empty input", () => {
    expect(() => emailToMarkdown.execute({ input: "" })).toThrow(
      "Input cannot be empty"
    );
  });

  it("throws on whitespace-only input", () => {
    expect(() => emailToMarkdown.execute({ input: "  \n  " })).toThrow(
      "Input cannot be empty"
    );
  });
});
