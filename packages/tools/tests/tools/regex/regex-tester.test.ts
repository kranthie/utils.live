import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { regexTester } from "../../../src/tools/regex/regex-tester";

describe("Regex Tester", () => {
  it("should find matches with global flag", async () => {
    const result = await executeTool(
      regexTester,
      { input: "hello world foo" },
      { pattern: "\\w+", flags: "g" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).matchCount).toBe(3);
      expect((result.data as Record<string, unknown>).matches).toEqual([
        "hello",
        "world",
        "foo",
      ]);
      expect((result.data as Record<string, unknown>).isMatch).toBe(true);
    }
  });

  it("should report no matches", async () => {
    const result = await executeTool(
      regexTester,
      { input: "hello" },
      { pattern: "\\d+", flags: "g" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).matchCount).toBe(0);
      expect((result.data as Record<string, unknown>).isMatch).toBe(false);
    }
  });

  it("should handle case-insensitive flag", async () => {
    const result = await executeTool(
      regexTester,
      { input: "Hello HELLO" },
      { pattern: "hello", flags: "gi" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).matchCount).toBe(2);
    }
  });

  it("should reject invalid regex", async () => {
    const result = await executeTool(
      regexTester,
      { input: "test" },
      { pattern: "[invalid", flags: "g" }
    );
    expect(result.success).toBe(false);
  });
});
