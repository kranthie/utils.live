import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { regexExtract } from "../../../src/tools/regex/regex-extract";

describe("Regex Extract", () => {
  it("should extract all matches", async () => {
    const result = await executeTool(
      regexExtract,
      { input: "age: 25, score: 99" },
      { pattern: "\\d+", flags: "g" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).matches).toEqual([
        "25",
        "99",
      ]);
      expect((result.data as Record<string, unknown>).count).toBe(2);
    }
  });

  it("should return unique matches when requested", async () => {
    const result = await executeTool(
      regexExtract,
      { input: "foo bar foo baz foo" },
      { pattern: "\\w+", flags: "g", unique: true }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).matches).toEqual([
        "foo",
        "bar",
        "baz",
      ]);
    }
  });

  it("should report no matches", async () => {
    const result = await executeTool(
      regexExtract,
      { input: "hello" },
      { pattern: "\\d+", flags: "g" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).count).toBe(0);
      expect((result.data as Record<string, unknown>).output).toContain(
        "no matches"
      );
    }
  });
});
