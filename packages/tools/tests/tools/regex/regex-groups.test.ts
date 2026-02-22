import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { regexGroups } from "../../../src/tools/regex/regex-groups";

describe("Regex Groups", () => {
  it("should extract numbered groups", async () => {
    const result = await executeTool(
      regexGroups,
      { input: "2024-01-15" },
      { pattern: "(\\d{4})-(\\d{2})-(\\d{2})", flags: "" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).matchCount).toBe(1);
      expect(
        (
          (result.data as Record<string, unknown>).groups as Record<
            string,
            string
          >[]
        )[0]!["1"]
      ).toBe("2024");
      expect(
        (
          (result.data as Record<string, unknown>).groups as Record<
            string,
            string
          >[]
        )[0]!["2"]
      ).toBe("01");
      expect(
        (
          (result.data as Record<string, unknown>).groups as Record<
            string,
            string
          >[]
        )[0]!["3"]
      ).toBe("15");
    }
  });

  it("should extract named groups", async () => {
    const result = await executeTool(
      regexGroups,
      { input: "John 30" },
      { pattern: "(?<name>\\w+) (?<age>\\d+)", flags: "" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(
        (
          (result.data as Record<string, unknown>).groups as Record<
            string,
            string
          >[]
        )[0]!["name"]
      ).toBe("John");
      expect(
        (
          (result.data as Record<string, unknown>).groups as Record<
            string,
            string
          >[]
        )[0]!["age"]
      ).toBe("30");
    }
  });

  it("should find multiple matches with global flag", async () => {
    const result = await executeTool(
      regexGroups,
      { input: "a1 b2 c3" },
      { pattern: "([a-z])(\\d)", flags: "g" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).matchCount).toBe(3);
    }
  });
});
