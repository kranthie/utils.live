import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { phoneRegex } from "../../../src/tools/regex/phone-regex";

describe("Phone Regex", () => {
  it("should return US phone pattern", async () => {
    const result = await executeTool(phoneRegex, { type: "us" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).pattern).toBeDefined();
    }
  });

  it("should return international pattern", async () => {
    const result = await executeTool(phoneRegex, { type: "international" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).pattern).toBeDefined();
    }
  });

  it("should return E.164 pattern", async () => {
    const result = await executeTool(phoneRegex, { type: "e164" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).pattern).toBeDefined();
    }
  });
});
