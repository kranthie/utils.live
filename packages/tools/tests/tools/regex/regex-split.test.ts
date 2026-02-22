import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { regexSplit } from "../../../src/tools/regex/regex-split";

describe("Regex Split", () => {
  it("should split by comma with optional spaces", async () => {
    const result = await executeTool(
      regexSplit,
      { input: "a, b, c" },
      { pattern: ",\\s*" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).parts).toEqual([
        "a",
        "b",
        "c",
      ]);
      expect((result.data as Record<string, unknown>).count).toBe(3);
    }
  });

  it("should respect limit", async () => {
    const result = await executeTool(
      regexSplit,
      { input: "a-b-c-d" },
      { pattern: "-", limit: 2 }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).parts).toHaveLength(2);
    }
  });

  it("should handle no matches", async () => {
    const result = await executeTool(
      regexSplit,
      { input: "hello" },
      { pattern: "," }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).parts).toEqual(["hello"]);
      expect((result.data as Record<string, unknown>).count).toBe(1);
    }
  });
});
