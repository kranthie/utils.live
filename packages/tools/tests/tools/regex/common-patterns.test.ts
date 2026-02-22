import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { commonPatterns } from "../../../src/tools/regex/common-patterns";

describe("Common Patterns", () => {
  it("should return all patterns when category is 'all'", async () => {
    const result = await executeTool(commonPatterns, { category: "all" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "email"
      );
      expect((result.data as Record<string, unknown>).output).toContain("url");
      expect((result.data as Record<string, unknown>).output).toContain("ipv4");
    }
  });

  it("should return specific pattern for email", async () => {
    const result = await executeTool(commonPatterns, { category: "email" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "email"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "Pattern"
      );
    }
  });

  it("should return UUID pattern", async () => {
    const result = await executeTool(commonPatterns, { category: "uuid" });
    expect(result.success).toBe(true);
    if (result.success) {
      const regex = new RegExp(
        String((result.data as Record<string, unknown>).output).match(
          /Pattern:\s+(.+)/
        )?.[1] || ""
      );
      expect(regex.test("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    }
  });
});
