import { describe, it, expect } from "vitest";
import { emailHeaderParser } from "../../../src/tools/communication/email-header-parser";

interface HeaderResult {
  summary: {
    from: string;
    to: string;
    subject: string;
    date: string;
    messageId: string;
  };
  headers: Record<string, string | string[]>;
  receivedHops: number;
  authenticationResults: string;
  spf: string;
  hasDkim: boolean;
}

describe("email-header-parser", () => {
  const execute = (input: string): HeaderResult => {
    const result = emailHeaderParser.execute({ input }) as { output: string };
    return JSON.parse(result.output) as HeaderResult;
  };

  it("parses basic headers", () => {
    const result = execute(
      "From: user@example.com\nTo: dest@example.com\nSubject: Test"
    );
    expect(result.summary.from).toBe("user@example.com");
    expect(result.summary.to).toBe("dest@example.com");
    expect(result.summary.subject).toBe("Test");
  });

  it("parses all standard headers into summary", () => {
    const result = execute(
      "From: a@example.com\nTo: b@example.com\nSubject: Hello\nDate: Mon, 1 Jan 2025 00:00:00 +0000\nMessage-ID: <id@example.com>"
    );
    expect(result.summary.date).toBe("Mon, 1 Jan 2025 00:00:00 +0000");
    expect(result.summary.messageId).toBe("<id@example.com>");
  });

  it("preserves raw headers", () => {
    const result = execute("X-Custom: value123\nFrom: a@example.com");
    expect(result.headers["X-Custom"]).toBe("value123");
    expect(result.headers["From"]).toBe("a@example.com");
  });

  it("handles continuation lines (folded headers)", () => {
    const result = execute(
      "Subject: This is a very long\n subject line that wraps"
    );
    expect(result.summary.subject).toBe(
      "This is a very long subject line that wraps"
    );
  });

  it("handles multiple Received headers", () => {
    const result = execute(
      "Received: from a by b\nReceived: from c by d\nFrom: x@example.com"
    );
    expect(result.receivedHops).toBe(2);
    expect(result.headers["Received"]).toHaveLength(2);
  });

  it("counts single Received header", () => {
    const result = execute(
      "Received: from smtp.example.com by mx.example.com\nFrom: x@example.com"
    );
    expect(result.receivedHops).toBe(1);
  });

  it("detects authentication results", () => {
    const result = execute(
      "Authentication-Results: mx.example.com; spf=pass\nFrom: x@example.com"
    );
    expect(result.authenticationResults).toBe("mx.example.com; spf=pass");
  });

  it("detects SPF results", () => {
    const result = execute(
      "Received-SPF: pass (example.com: domain of sender)\nFrom: x@example.com"
    );
    expect(result.spf).toBe("pass (example.com: domain of sender)");
  });

  it("detects DKIM signature", () => {
    const result = execute(
      "DKIM-Signature: v=1; a=rsa-sha256; d=example.com\nFrom: x@example.com"
    );
    expect(result.hasDkim).toBe(true);
  });

  it("stops at empty line (body separator)", () => {
    const result = execute(
      "From: a@example.com\nSubject: Test\n\nThis is the body"
    );
    expect(result.headers["From"]).toBe("a@example.com");
    expect(Object.keys(result.headers)).toHaveLength(2);
  });

  it("handles duplicate headers as array", () => {
    const result = execute(
      "X-Tag: one\nX-Tag: two\nX-Tag: three\nFrom: x@example.com"
    );
    expect(result.headers["X-Tag"]).toEqual(["one", "two", "three"]);
  });

  it("throws on empty input", () => {
    expect(() => emailHeaderParser.execute({ input: "" })).toThrow(
      "Input cannot be empty"
    );
  });

  it("throws on whitespace-only input", () => {
    expect(() => emailHeaderParser.execute({ input: "   " })).toThrow(
      "Input cannot be empty"
    );
  });
});
