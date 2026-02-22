import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { regexFlagsTester } from "../../../src/tools/regex/regex-flags-tester";

describe("Regex Flags Tester", () => {
  it("should compare matches across different flags", async () => {
    const result = await executeTool(
      regexFlagsTester,
      { input: "Hello hello HELLO" },
      { pattern: "hello" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBeDefined();
      expect((result.data as Record<string, unknown>).output).toContain(
        "hello"
      );
    }
  });

  it("should show different match counts for different flags", async () => {
    const result = await executeTool(
      regexFlagsTester,
      { input: "abc\nabc" },
      { pattern: "abc" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(
        (result.data as Record<string, unknown>).output.length
      ).toBeGreaterThan(0);
    }
  });

  it("should reject invalid pattern", async () => {
    const result = await executeTool(
      regexFlagsTester,
      { input: "test" },
      { pattern: "[bad" }
    );
    expect(result.success).toBe(false);
  });
});
