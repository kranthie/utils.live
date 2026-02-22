import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { regexReplace } from "../../../src/tools/regex/regex-replace";

describe("Regex Replace", () => {
  it("should replace all matches", async () => {
    const result = await executeTool(
      regexReplace,
      { input: "foo bar foo" },
      { pattern: "foo", replacement: "baz", flags: "g" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBe(
        "baz bar baz"
      );
      expect((result.data as Record<string, unknown>).replacements).toBe(2);
    }
  });

  it("should replace first match only without global flag", async () => {
    const result = await executeTool(
      regexReplace,
      { input: "foo bar foo" },
      { pattern: "foo", replacement: "baz", flags: "" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBe(
        "baz bar foo"
      );
      expect((result.data as Record<string, unknown>).replacements).toBe(1);
    }
  });

  it("should handle backreferences", async () => {
    const result = await executeTool(
      regexReplace,
      { input: "John Smith" },
      { pattern: "(\\w+) (\\w+)", replacement: "$2, $1", flags: "" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBe(
        "Smith, John"
      );
    }
  });

  it("should reject invalid pattern", async () => {
    const result = await executeTool(
      regexReplace,
      { input: "test" },
      { pattern: "[bad", replacement: "", flags: "g" }
    );
    expect(result.success).toBe(false);
  });
});
