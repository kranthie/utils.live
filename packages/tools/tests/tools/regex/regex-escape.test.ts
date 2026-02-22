import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { regexEscape } from "../../../src/tools/regex/regex-escape";

describe("Regex Escape", () => {
  it("should escape special characters", async () => {
    const result = await executeTool(regexEscape, { input: "hello.world*" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBe(
        "hello\\.world\\*"
      );
      expect((result.data as Record<string, unknown>).escapedCount).toBe(2);
    }
  });

  it("should escape brackets and parentheses", async () => {
    const result = await executeTool(regexEscape, { input: "(foo)[bar]{baz}" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBe(
        "\\(foo\\)\\[bar\\]\\{baz\\}"
      );
      expect((result.data as Record<string, unknown>).escapedCount).toBe(6);
    }
  });

  it("should leave non-special characters unchanged", async () => {
    const result = await executeTool(regexEscape, { input: "hello world" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBe(
        "hello world"
      );
      expect((result.data as Record<string, unknown>).escapedCount).toBe(0);
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(regexEscape, { input: "" });
    expect(result.success).toBe(false);
  });
});
