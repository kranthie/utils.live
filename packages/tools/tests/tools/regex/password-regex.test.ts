import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { passwordRegex } from "../../../src/tools/regex/password-regex";

describe("Password Regex", () => {
  it("should generate a password regex with defaults", async () => {
    const result = await executeTool(passwordRegex, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).pattern).toBeDefined();
    }
  });

  it("should require uppercase when specified", async () => {
    const result = await executeTool(passwordRegex, { requireUppercase: true });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).pattern).toContain("A-Z");
    }
  });

  it("should respect minimum length", async () => {
    const result = await executeTool(passwordRegex, { minLength: 12 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).pattern).toContain("12");
    }
  });
});
