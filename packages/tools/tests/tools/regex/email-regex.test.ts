import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { emailRegex } from "../../../src/tools/regex/email-regex";

describe("Email Regex", () => {
  it("should return standard email pattern", async () => {
    const result = await executeTool(emailRegex, { strictness: "standard" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).pattern).toBeDefined();
      const regex = new RegExp(
        (result.data as Record<string, unknown>).pattern
      );
      expect(regex.test("user@example.com")).toBe(true);
      expect(regex.test("invalid")).toBe(false);
    }
  });

  it("should return basic pattern", async () => {
    const result = await executeTool(emailRegex, { strictness: "basic" });
    expect(result.success).toBe(true);
    if (result.success) {
      const regex = new RegExp(
        (result.data as Record<string, unknown>).pattern
      );
      expect(regex.test("a@b.c")).toBe(true);
    }
  });

  it("should return strict RFC pattern", async () => {
    const result = await executeTool(emailRegex, { strictness: "strict" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).description).toContain(
        "RFC"
      );
    }
  });
});
